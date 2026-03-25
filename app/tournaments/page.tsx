"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Calendar, 
  Users, 
  DollarSign,
  Plus,
  Search,
  Filter,
  Clock,
  Gamepad2,
  Star,
  TrendingUp,
  Zap,
  Crown,
  Play,
  Eye,
  MapPin,
  Target,
  Award
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Tournament, tournamentManager } from '@/lib/tournaments/tournament-manager';
import FilterProvider, { useFilters } from '@/components/filters/FilterProvider';

interface FeaturedTournament extends Tournament {
  is_featured: boolean;
  featured_until: string;
  highlight_color: string;
}

function TournamentDiscovery() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { filters, applyFilters } = useFilters();
  
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [featuredTournaments, setFeaturedTournaments] = useState<FeaturedTournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGame, setSelectedGame] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [prizeFilter, setPrizeFilter] = useState('all');

  useEffect(() => {
    loadTournaments();
    loadFeaturedTournaments();
  }, [selectedGame, statusFilter, prizeFilter]);

  const loadTournaments = async () => {
    setLoading(true);
    try {
      // Mock tournament data - would fetch from database
      const mockTournaments: Tournament[] = [
        {
          id: '1',
          name: 'Valorant Champions Series 2024',
          description: 'The ultimate Valorant competition with teams from around the world',
          game_id: 'valorant',
          organizer_id: 'esl_gaming',
          status: 'registration_open',
          format: 'team',
          bracket_type: 'single_elimination',
          max_participants: 64,
          current_participants: 42,
          entry_fee: 50,
          prize_pool: 50000,
          sponsor_prize_pool: 25000,
          registration_start: '2024-02-01T00:00:00Z',
          registration_end: '2024-02-15T23:59:59Z',
          check_in_start: '2024-02-16T10:00:00Z',
          check_in_end: '2024-02-16T12:00:00Z',
          tournament_start: '2024-02-17T14:00:00Z',
          rules: 'Standard Valorant competitive rules apply...',
          created_at: '2024-01-15T00:00:00Z',
          updated_at: '2024-01-15T00:00:00Z',
          game: { id: 'valorant', name: 'Valorant', cover_url: '/games/valorant.jpg' },
          organizer: { id: 'esl_gaming', display_name: 'ESL Gaming', avatar_url: '/orgs/esl.png' }
        },
        {
          id: '2',
          name: 'CS:GO Major Qualifier',
          description: 'Qualify for the next CS:GO Major championship',
          game_id: 'csgo',
          organizer_id: 'faceit',
          status: 'registration_open',
          format: 'team',
          bracket_type: 'double_elimination',
          max_participants: 32,
          current_participants: 28,
          prize_pool: 25000,
          registration_start: '2024-02-05T00:00:00Z',
          registration_end: '2024-02-20T23:59:59Z',
          check_in_start: '2024-02-21T09:00:00Z',
          check_in_end: '2024-02-21T11:00:00Z',
          tournament_start: '2024-02-22T13:00:00Z',
          rules: 'FACEIT Anti-Cheat required...',
          created_at: '2024-01-20T00:00:00Z',
          updated_at: '2024-01-20T00:00:00Z',
          game: { id: 'csgo', name: 'CS:GO', cover_url: '/games/csgo.jpg' },
          organizer: { id: 'faceit', display_name: 'FACEIT', avatar_url: '/orgs/faceit.png' }
        },
        {
          id: '3',
          name: 'Fortnite Solo Championship',
          description: 'Battle royale solo tournament for individual players',
          game_id: 'fortnite',
          organizer_id: 'epic_games',
          status: 'in_progress',
          format: 'solo',
          bracket_type: 'round_robin',
          max_participants: 100,
          current_participants: 100,
          entry_fee: 25,
          prize_pool: 15000,
          registration_start: '2024-01-20T00:00:00Z',
          registration_end: '2024-02-01T23:59:59Z',
          check_in_start: '2024-02-02T10:00:00Z',
          check_in_end: '2024-02-02T12:00:00Z',
          tournament_start: '2024-02-03T15:00:00Z',
          rules: 'Epic Games tournament rules...',
          created_at: '2024-01-10T00:00:00Z',
          updated_at: '2024-02-03T15:00:00Z',
          game: { id: 'fortnite', name: 'Fortnite', cover_url: '/games/fortnite.jpg' },
          organizer: { id: 'epic_games', display_name: 'Epic Games', avatar_url: '/orgs/epic.png' }
        }
      ];
      
      setTournaments(mockTournaments);
    } catch (error) {
      console.error('Error loading tournaments:', error);
      toast({
        title: "Error loading tournaments",
        description: "Please try refreshing the page.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadFeaturedTournaments = async () => {
    // Mock featured tournaments
    const mockFeatured: FeaturedTournament[] = [
      {
        ...tournaments[0],
        is_featured: true,
        featured_until: '2024-02-20T00:00:00Z',
        highlight_color: 'from-purple-500 to-pink-500'
      }
    ] as FeaturedTournament[];
    
    setFeaturedTournaments(mockFeatured);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'draft': { color: 'bg-gray-500', text: 'Draft' },
      'registration_open': { color: 'bg-green-500', text: 'Registration Open' },
      'registration_closed': { color: 'bg-yellow-500', text: 'Registration Closed' },
      'check_in': { color: 'bg-blue-500', text: 'Check-in Open' },
      'in_progress': { color: 'bg-orange-500 animate-pulse', text: 'Live' },
      'completed': { color: 'bg-gray-600', text: 'Completed' },
      'cancelled': { color: 'bg-red-500', text: 'Cancelled' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    
    return (
      <Badge className={`${config.color} text-white`}>
        {config.text}
      </Badge>
    );
  };

  const getTimeUntilStart = (startDate: string) => {
    const start = new Date(startDate);
    const now = new Date();
    const diff = start.getTime() - now.getTime();
    
    if (diff <= 0) return 'Started';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    return 'Soon';
  };

  const filteredTournaments = tournaments.filter(tournament => {
    if (searchQuery && !tournament.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (selectedGame !== 'all' && tournament.game_id !== selectedGame) return false;
    if (statusFilter !== 'all' && tournament.status !== statusFilter) return false;
    
    if (prizeFilter !== 'all') {
      const totalPrize = tournament.prize_pool + (tournament.sponsor_prize_pool || 0);
      if (prizeFilter === '10k+' && totalPrize < 10000) return false;
      if (prizeFilter === '25k+' && totalPrize < 25000) return false;
      if (prizeFilter === '50k+' && totalPrize < 50000) return false;
    }
    
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-gaming-purple/20 via-gaming-pink/20 to-gaming-blue/20 pb-8">
        <div className="container mx-auto px-4 pt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-gaming font-bold mb-4">
              <span className="bg-gradient-to-r from-gaming-purple to-gaming-pink bg-clip-text text-transparent">
                Tournament Hub
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-6">
              Compete in esports tournaments and climb the global rankings
            </p>
            
            {user && (
              <Link href="/tournaments/create">
                <Button size="lg" className="bg-gradient-to-r from-gaming-purple to-gaming-pink hover:opacity-90">
                  <Plus className="mr-2 h-5 w-5" />
                  Create Tournament
                </Button>
              </Link>
            )}
          </motion.div>

          {/* Quick Stats */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 text-center">
                <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                <p className="text-2xl font-bold">147</p>
                <p className="text-sm text-muted-foreground">Active Tournaments</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p className="text-2xl font-bold">$2.4M</p>
                <p className="text-sm text-muted-foreground">Prize Pool</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <p className="text-2xl font-bold">15.2K</p>
                <p className="text-sm text-muted-foreground">Players</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <Gamepad2 className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                <p className="text-2xl font-bold">24</p>
                <p className="text-sm text-muted-foreground">Games</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Featured Tournaments */}
        {featuredTournaments.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Star className="h-6 w-6 text-yellow-500" />
              Featured Tournaments
            </h2>
            
            <div className="grid lg:grid-cols-2 gap-6">
              {featuredTournaments.map((tournament, index) => (
                <motion.div
                  key={tournament.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`overflow-hidden border-2 bg-gradient-to-r ${tournament.highlight_color} p-0.5`}>
                    <div className="bg-background rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-4">
                          <img 
                            src={tournament.game?.cover_url || '/placeholder-game.png'}
                            alt={tournament.game?.name}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                          <div>
                            <h3 className="text-xl font-bold">{tournament.name}</h3>
                            <p className="text-muted-foreground">{tournament.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              {getStatusBadge(tournament.status)}
                              <Badge variant="outline">
                                {tournament.format} • {tournament.bracket_type.replace('_', ' ')}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <Crown className="h-6 w-6 text-yellow-500" />
                      </div>
                      
                      <div className="grid grid-cols-4 gap-4 mb-4">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Prize Pool</p>
                          <p className="font-bold text-green-500">
                            ${(tournament.prize_pool + (tournament.sponsor_prize_pool || 0)).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Players</p>
                          <p className="font-bold">{tournament.current_participants}/{tournament.max_participants}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Starts In</p>
                          <p className="font-bold">{getTimeUntilStart(tournament.tournament_start)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Entry Fee</p>
                          <p className="font-bold">{tournament.entry_fee ? `$${tournament.entry_fee}` : 'Free'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Progress 
                          value={(tournament.current_participants / tournament.max_participants) * 100}
                          className="flex-1 mr-4"
                        />
                        <Link href={`/tournaments/${tournament.id}`}>
                          <Button className="bg-gradient-to-r from-gaming-purple to-gaming-pink hover:opacity-90">
                            {tournament.status === 'registration_open' ? 'Register Now' : 'View Details'}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tournaments..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={selectedGame} onValueChange={setSelectedGame}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Games</SelectItem>
                <SelectItem value="valorant">Valorant</SelectItem>
                <SelectItem value="csgo">CS:GO</SelectItem>
                <SelectItem value="fortnite">Fortnite</SelectItem>
                <SelectItem value="apex">Apex Legends</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="registration_open">Open Registration</SelectItem>
                <SelectItem value="check_in">Check-in</SelectItem>
                <SelectItem value="in_progress">Live</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={prizeFilter} onValueChange={setPrizeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prizes</SelectItem>
                <SelectItem value="10k+">$10K+</SelectItem>
                <SelectItem value="25k+">$25K+</SelectItem>
                <SelectItem value="50k+">$50K+</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="live">Live</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="my-tournaments">My Tournaments</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-8">
            {loading ? (
              <div className="grid lg:grid-cols-2 gap-6">
                {Array.from({ length: 4 }, (_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="animate-pulse space-y-4">
                        <div className="h-4 bg-secondary rounded w-3/4" />
                        <div className="h-3 bg-secondary rounded w-1/2" />
                        <div className="h-2 bg-secondary rounded w-full" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredTournaments.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-semibold mb-2">No tournaments found</p>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your search filters or check back later for new tournaments
                  </p>
                  {user && (
                    <Link href="/tournaments/create">
                      <Button>Create Tournament</Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid lg:grid-cols-2 gap-6">
                {filteredTournaments
                  .filter(t => t.status !== 'completed' && t.status !== 'in_progress')
                  .map((tournament, index) => (
                  <motion.div
                    key={tournament.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start gap-4">
                            <img 
                              src={tournament.game?.cover_url || '/placeholder-game.png'}
                              alt={tournament.game?.name}
                              className="w-12 h-12 rounded object-cover"
                            />
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">{tournament.name}</h3>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {tournament.description}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                {getStatusBadge(tournament.status)}
                                <Badge variant="outline" className="text-xs">
                                  {tournament.format}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <p className="font-bold text-green-500">
                              ${(tournament.prize_pool + (tournament.sponsor_prize_pool || 0)).toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground">Prize Pool</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                          <div className="text-center p-2 bg-secondary/20 rounded">
                            <Users className="h-4 w-4 mx-auto mb-1" />
                            <p className="font-medium">{tournament.current_participants}/{tournament.max_participants}</p>
                            <p className="text-xs text-muted-foreground">Players</p>
                          </div>
                          
                          <div className="text-center p-2 bg-secondary/20 rounded">
                            <Calendar className="h-4 w-4 mx-auto mb-1" />
                            <p className="font-medium">{getTimeUntilStart(tournament.tournament_start)}</p>
                            <p className="text-xs text-muted-foreground">Starts</p>
                          </div>
                          
                          <div className="text-center p-2 bg-secondary/20 rounded">
                            <DollarSign className="h-4 w-4 mx-auto mb-1" />
                            <p className="font-medium">{tournament.entry_fee ? `$${tournament.entry_fee}` : 'Free'}</p>
                            <p className="text-xs text-muted-foreground">Entry</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <Progress 
                            value={(tournament.current_participants / tournament.max_participants) * 100}
                            className="flex-1"
                          />
                          <Link href={`/tournaments/${tournament.id}`}>
                            <Button size="sm">
                              {tournament.status === 'registration_open' ? 'Register' : 'View'}
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="live" className="mt-8">
            <div className="grid lg:grid-cols-2 gap-6">
              {filteredTournaments
                .filter(t => t.status === 'in_progress')
                .map((tournament, index) => (
                <Card key={tournament.id} className="border-orange-500">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                      <Badge className="bg-red-500 text-white">LIVE</Badge>
                      <span className="text-sm font-medium">{tournament.name}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <img 
                          src={tournament.game?.cover_url || '/placeholder-game.png'}
                          alt={tournament.game?.name}
                          className="w-10 h-10 rounded object-cover"
                        />
                        <div>
                          <p className="font-medium">{tournament.game?.name}</p>
                          <p className="text-sm text-muted-foreground">{tournament.current_participants} players</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Link href={`/tournaments/${tournament.id}/stream`}>
                          <Button size="sm" variant="outline">
                            <Play className="h-4 w-4 mr-2" />
                            Watch
                          </Button>
                        </Link>
                        <Link href={`/tournaments/${tournament.id}`}>
                          <Button size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="completed" className="mt-8">
            <div className="grid lg:grid-cols-2 gap-6">
              {filteredTournaments
                .filter(t => t.status === 'completed')
                .map((tournament, index) => (
                <Card key={tournament.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <img 
                          src={tournament.game?.cover_url || '/placeholder-game.png'}
                          alt={tournament.game?.name}
                          className="w-12 h-12 rounded object-cover"
                        />
                        <div>
                          <h3 className="font-semibold">{tournament.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Completed {new Date(tournament.tournament_end || '').toLocaleDateString()}
                          </p>
                          <Badge variant="outline" className="mt-2">
                            {tournament.current_participants} participants
                          </Badge>
                        </div>
                      </div>
                      
                      <Link href={`/tournaments/${tournament.id}/results`}>
                        <Button size="sm" variant="outline">
                          <Trophy className="h-4 w-4 mr-2" />
                          Results
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="my-tournaments" className="mt-8">
            {user ? (
              <div className="text-center py-12">
                <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-semibold mb-2">Your Tournaments</p>
                <p className="text-muted-foreground mb-4">
                  Tournaments you've created or participated in will appear here
                </p>
                <Link href="/tournaments/create">
                  <Button>Create Your First Tournament</Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-semibold mb-2">Sign in required</p>
                <p className="text-muted-foreground mb-4">
                  Sign in to view your tournament history and create tournaments
                </p>
                <Link href="/auth/signin">
                  <Button>Sign In</Button>
                </Link>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function TournamentsPage() {
  return (
    <FilterProvider>
      <TournamentDiscovery />
    </FilterProvider>
  );
}
