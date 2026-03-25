"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Calendar, 
  Users, 
  DollarSign,
  Clock,
  Gamepad2,
  MapPin,
  Shield,
  Star,
  Play,
  Eye,
  Share,
  Settings,
  CheckCircle,
  AlertCircle,
  Crown,
  Medal,
  Award,
  Building,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Tournament, TournamentParticipant, tournamentManager } from '@/lib/tournaments/tournament-manager';
import TournamentRegistration from '@/components/tournaments/TournamentRegistration';
import TournamentCheckIn from '@/components/tournaments/TournamentCheckIn';
import TournamentStream from '@/components/tournaments/TournamentStream';
import PrizePoolManager from '@/components/tournaments/PrizePoolManager';

export default function TournamentDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [userParticipant, setUserParticipant] = useState<TournamentParticipant | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const tournamentId = params.id as string;

  useEffect(() => {
    if (tournamentId) {
      loadTournament();
    }
  }, [tournamentId, user]);

  const loadTournament = async () => {
    setLoading(true);
    try {
      // Mock tournament data - would fetch from database
      const mockTournament: Tournament = {
        id: tournamentId,
        name: 'Valorant Champions Series 2024',
        description: 'The ultimate Valorant competition featuring the best teams from around the world. This tournament showcases the highest level of competitive Valorant with a massive prize pool and incredible production value.',
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
        rules: `
          <h3>Tournament Rules</h3>
          <ul>
            <li>Standard Valorant competitive ruleset applies</li>
            <li>Best of 3 format for all matches except finals (BO5)</li>
            <li>Team rosters must be locked before check-in</li>
            <li>Coaches are allowed during tactical timeouts</li>
            <li>All matches must be played on tournament realm</li>
            <li>Anti-cheat software required for all participants</li>
            <li>Unsportsmanlike conduct will result in disqualification</li>
          </ul>
          
          <h3>Technical Requirements</h3>
          <ul>
            <li>Minimum 60 FPS gameplay capability</li>
            <li>Stable internet connection (ping < 80ms)</li>
            <li>Discord for communication</li>
            <li>OBS or similar for streaming (if required)</li>
          </ul>
        `,
        stream_url: 'https://twitch.tv/esl_valorant',
        created_at: '2024-01-15T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
        game: { id: 'valorant', name: 'Valorant', cover_url: '/games/valorant.jpg' },
        organizer: { 
          id: 'esl_gaming', 
          display_name: 'ESL Gaming',
          avatar_url: '/orgs/esl.png'
        },
        sponsors: [
          {
            id: '1',
            tournament_id: tournamentId,
            sponsor_name: 'HyperX Gaming',
            sponsor_logo: '/sponsors/hyperx.png',
            sponsor_url: 'https://hyperxgaming.com',
            contribution_amount: 15000,
            sponsor_tier: 'title',
            created_at: '2024-01-15T00:00:00Z'
          },
          {
            id: '2',
            tournament_id: tournamentId,
            sponsor_name: 'ASUS ROG',
            sponsor_logo: '/sponsors/asus.png',
            sponsor_url: 'https://rog.asus.com',
            contribution_amount: 10000,
            sponsor_tier: 'presenting',
            created_at: '2024-01-16T00:00:00Z'
          }
        ]
      };
      
      setTournament(mockTournament);
      
      // Check if user is registered
      if (user) {
        const mockParticipant: TournamentParticipant = {
          id: '1',
          tournament_id: tournamentId,
          participant_id: user.id,
          participant_type: 'user',
          registration_date: '2024-01-20T00:00:00Z',
          checked_in: false,
          eliminated: false,
          user: {
            id: user.id,
            username: user.user_metadata?.username || user.email || '',
            display_name: user.user_metadata?.display_name || user.email || '',
            avatar_url: user.user_metadata?.avatar_url
          }
        };
        
        // setUserParticipant(mockParticipant); // Uncomment if user is registered
      }
    } catch (error) {
      console.error('Error loading tournament:', error);
      toast({
        title: "Error loading tournament",
        description: "Tournament not found or an error occurred.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrationComplete = () => {
    loadTournament();
    setActiveTab('registration');
  };

  const handleCheckInComplete = () => {
    loadTournament();
  };

  const getStatusInfo = () => {
    if (!tournament) return { color: 'gray', message: 'Unknown' };
    
    switch (tournament.status) {
      case 'registration_open':
        return { color: 'green', message: 'Registration Open' };
      case 'registration_closed':
        return { color: 'yellow', message: 'Registration Closed' };
      case 'check_in':
        return { color: 'blue', message: 'Check-in Open' };
      case 'in_progress':
        return { color: 'orange', message: 'Tournament in Progress' };
      case 'completed':
        return { color: 'gray', message: 'Completed' };
      default:
        return { color: 'gray', message: 'Unknown Status' };
    }
  };

  const getTimeUntilStart = () => {
    if (!tournament) return 'Unknown';
    
    const start = new Date(tournament.tournament_start);
    const now = new Date();
    const diff = start.getTime() - now.getTime();
    
    if (diff <= 0) return 'Started';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const totalPrizePool = tournament 
    ? tournament.prize_pool + (tournament.sponsor_prize_pool || 0)
    : 0;

  const isOrganizer = user?.id === tournament?.organizer_id;
  const isRegistered = !!userParticipant;
  const canRegister = tournament?.status === 'registration_open' && !isRegistered;
  const needsCheckIn = tournament?.status === 'check_in' && isRegistered && !userParticipant?.checked_in;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-semibold mb-2">Tournament not found</p>
            <p className="text-muted-foreground mb-4">
              The tournament you're looking for doesn't exist or has been removed.
            </p>
            <Link href="/tournaments">
              <Button>Browse Tournaments</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = getStatusInfo();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-gaming-purple/20 via-gaming-pink/20 to-gaming-blue/20 pb-8">
        <div className="container mx-auto px-4 pt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start gap-6">
                <img 
                  src={tournament.game?.cover_url || '/placeholder-game.png'}
                  alt={tournament.game?.name}
                  className="w-24 h-24 rounded-lg object-cover shadow-lg"
                />
                <div>
                  <h1 className="text-3xl md:text-4xl font-gaming font-bold mb-2">
                    {tournament.name}
                  </h1>
                  <p className="text-lg text-muted-foreground mb-4 max-w-2xl">
                    {tournament.description}
                  </p>
                  <div className="flex items-center gap-4">
                    <Badge className={`bg-${statusInfo.color}-500 text-white`}>
                      {statusInfo.message}
                    </Badge>
                    <Badge variant="outline">
                      {tournament.format} • {tournament.bracket_type.replace('_', ' ')}
                    </Badge>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={tournament.organizer?.avatar_url} />
                        <AvatarFallback>
                          {tournament.organizer?.display_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span>by {tournament.organizer?.display_name}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {tournament.stream_url && (
                  <Link href={`/tournaments/${tournament.id}/stream`}>
                    <Button size="sm" variant="outline">
                      <Play className="h-4 w-4 mr-2" />
                      Watch Stream
                    </Button>
                  </Link>
                )}
                
                <Button size="sm" variant="outline">
                  <Share className="h-4 w-4 mr-2" />
                  Share
                </Button>
                
                {isOrganizer && (
                  <Link href={`/tournaments/${tournament.id}/admin`}>
                    <Button size="sm" variant="outline">
                      <Settings className="h-4 w-4 mr-2" />
                      Manage
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid md:grid-cols-5 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <DollarSign className="h-6 w-6 mx-auto mb-2 text-green-500" />
                  <p className="text-xl font-bold">${totalPrizePool.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Prize Pool</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <Users className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                  <p className="text-xl font-bold">{tournament.current_participants}/{tournament.max_participants}</p>
                  <p className="text-sm text-muted-foreground">Players</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <Calendar className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                  <p className="text-xl font-bold">{getTimeUntilStart()}</p>
                  <p className="text-sm text-muted-foreground">Time to Start</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <Shield className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                  <p className="text-xl font-bold">{tournament.entry_fee ? `$${tournament.entry_fee}` : 'Free'}</p>
                  <p className="text-sm text-muted-foreground">Entry Fee</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <Gamepad2 className="h-6 w-6 mx-auto mb-2 text-red-500" />
                  <p className="text-xl font-bold capitalize">{tournament.format}</p>
                  <p className="text-sm text-muted-foreground">Format</p>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Action Alerts */}
      <div className="container mx-auto px-4 py-6">
        {needsCheckIn && (
          <Alert className="mb-6 border-blue-500 bg-blue-500/10">
            <Clock className="h-4 w-4" />
            <AlertDescription>
              <strong>Check-in Required:</strong> You need to check in before the tournament starts.
              <Link href="#checkin" onClick={() => setActiveTab('checkin')}>
                <Button size="sm" className="ml-3">
                  Check In Now
                </Button>
              </Link>
            </AlertDescription>
          </Alert>
        )}
        
        {canRegister && (
          <Alert className="mb-6 border-green-500 bg-green-500/10">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Registration Open:</strong> Sign up now to secure your spot in this tournament.
              <Link href="#registration" onClick={() => setActiveTab('registration')}>
                <Button size="sm" className="ml-3">
                  Register Now
                </Button>
              </Link>
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="registration">Registration</TabsTrigger>
            <TabsTrigger value="checkin">Check-in</TabsTrigger>
            <TabsTrigger value="bracket">Bracket</TabsTrigger>
            <TabsTrigger value="prizes">Prizes</TabsTrigger>
            <TabsTrigger value="stream">Stream</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-8">
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                {/* Tournament Description */}
                <Card>
                  <CardHeader>
                    <CardTitle>About This Tournament</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {tournament.description}
                    </p>
                  </CardContent>
                </Card>

                {/* Tournament Rules */}
                <Card>
                  <CardHeader>
                    <CardTitle>Rules & Format</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <div dangerouslySetInnerHTML={{ __html: tournament.rules }} />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                {/* Tournament Schedule */}
                <Card>
                  <CardHeader>
                    <CardTitle>Schedule</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg">
                      <div>
                        <p className="font-medium">Registration Opens</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(tournament.registration_start).toLocaleString()}
                        </p>
                      </div>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg">
                      <div>
                        <p className="font-medium">Registration Closes</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(tournament.registration_end).toLocaleString()}
                        </p>
                      </div>
                      <Clock className="h-5 w-5 text-yellow-500" />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg">
                      <div>
                        <p className="font-medium">Check-in Period</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(tournament.check_in_start).toLocaleString()} - 
                          {new Date(tournament.check_in_end).toLocaleString()}
                        </p>
                      </div>
                      <AlertCircle className="h-5 w-5 text-blue-500" />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg">
                      <div>
                        <p className="font-medium">Tournament Starts</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(tournament.tournament_start).toLocaleString()}
                        </p>
                      </div>
                      <Play className="h-5 w-5 text-red-500" />
                    </div>
                  </CardContent>
                </Card>

                {/* Sponsors */}
                {tournament.sponsors && tournament.sponsors.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Sponsored By</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {tournament.sponsors.map((sponsor) => (
                        <div key={sponsor.id} className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center overflow-hidden">
                            {sponsor.sponsor_logo ? (
                              <img 
                                src={sponsor.sponsor_logo} 
                                alt={sponsor.sponsor_name}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <Building className="h-6 w-6 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{sponsor.sponsor_name}</p>
                            <Badge className="text-xs capitalize">{sponsor.sponsor_tier}</Badge>
                          </div>
                          {sponsor.sponsor_url && (
                            <a 
                              href={sponsor.sponsor_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button size="sm" variant="ghost">
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </a>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="registration" className="mt-8">
            <TournamentRegistration 
              tournament={tournament}
              onRegistrationComplete={handleRegistrationComplete}
            />
          </TabsContent>

          <TabsContent value="checkin" className="mt-8">
            <TournamentCheckIn 
              tournament={tournament}
              participant={userParticipant ?? undefined}
              onCheckInComplete={handleCheckInComplete}
            />
          </TabsContent>

          <TabsContent value="bracket" className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Tournament Bracket</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-semibold mb-2">Bracket Coming Soon</p>
                  <p className="text-muted-foreground">
                    The tournament bracket will be generated after registration closes
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="prizes" className="mt-8">
            <PrizePoolManager 
              tournament={tournament}
              isOrganizer={isOrganizer}
              onUpdate={loadTournament}
            />
          </TabsContent>

          <TabsContent value="stream" className="mt-8">
            <TournamentStream 
              tournament={tournament}
              isOfficial={true}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
