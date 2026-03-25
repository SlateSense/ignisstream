"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  Users, 
  Trophy, 
  DollarSign,
  Calendar,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  Edit,
  Trash2,
  Download,
  Upload,
  Eye,
  MessageSquare,
  Ban,
  Crown,
  Medal,
  Award,
  Target,
  Clock,
  Gamepad2,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Tournament, TournamentParticipant, TournamentMatch, tournamentManager } from '@/lib/tournaments/tournament-manager';

interface TournamentAdminDashboardProps {
  tournament: Tournament;
  onUpdate?: () => void;
}

export default function TournamentAdminDashboard({ tournament, onUpdate }: TournamentAdminDashboardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [participants, setParticipants] = useState<TournamentParticipant[]>([]);
  const [matches, setMatches] = useState<TournamentMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<TournamentParticipant | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [analytics, setAnalytics] = useState({
    registrationRate: 85,
    checkInRate: 92,
    completionRate: 78,
    avgMatchDuration: 45,
    totalViews: 15420,
    peakViewers: 2840
  });

  useEffect(() => {
    loadParticipants();
    loadMatches();
  }, [tournament.id]);

  const loadParticipants = async () => {
    // Mock participant data
    const mockParticipants: TournamentParticipant[] = Array.from({ length: tournament.current_participants }, (_, i) => ({
      id: `participant_${i + 1}`,
      tournament_id: tournament.id,
      participant_id: `user_${i + 1}`,
      participant_type: 'user',
      registration_date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      checked_in: Math.random() > 0.2,
      check_in_time: Math.random() > 0.2 ? new Date().toISOString() : undefined,
      seed: i + 1,
      eliminated: Math.random() > 0.8,
      placement: Math.random() > 0.9 ? Math.floor(Math.random() * 10) + 1 : undefined,
      user: {
        id: `user_${i + 1}`,
        username: `player${i + 1}`,
        display_name: `Pro Player ${i + 1}`,
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=player${i + 1}`
      }
    }));
    
    setParticipants(mockParticipants);
  };

  const loadMatches = async () => {
    // Mock match data
    const mockMatches: TournamentMatch[] = Array.from({ length: 8 }, (_, i) => ({
      id: `match_${i + 1}`,
      tournament_id: tournament.id,
      bracket_position: `1-${i + 1}`,
      round: 1,
      participant1_id: `user_${i * 2 + 1}`,
      participant2_id: `user_${i * 2 + 2}`,
      winner_id: Math.random() > 0.5 ? `user_${i * 2 + 1}` : `user_${i * 2 + 2}`,
      score: `${Math.floor(Math.random() * 3) + 1}-${Math.floor(Math.random() * 3)}`,
      status: ['pending', 'in_progress', 'completed'][Math.floor(Math.random() * 3)] as any,
      scheduled_time: new Date(Date.now() + Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      started_at: Math.random() > 0.5 ? new Date().toISOString() : undefined,
      completed_at: Math.random() > 0.7 ? new Date().toISOString() : undefined
    }));
    
    setMatches(mockMatches);
  };

  const handleStatusChange = async (newStatus: string) => {
    setLoading(true);
    try {
      const success = await tournamentManager.updateTournamentStatus(tournament.id, newStatus as any);
      if (success) {
        toast({
          title: "Status updated",
          description: `Tournament status changed to ${newStatus.replace('_', ' ')}`,
        });
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error updating status",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBracket = async () => {
    setLoading(true);
    try {
      const success = await tournamentManager.generateBracket(tournament.id);
      if (success) {
        toast({
          title: "Bracket generated!",
          description: "Tournament bracket has been created and matches scheduled.",
        });
        loadMatches();
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      console.error('Error generating bracket:', error);
      toast({
        title: "Error generating bracket",
        description: "Please ensure all participants are checked in.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleParticipantAction = async (participantId: string, action: 'disqualify' | 'check_in' | 'message') => {
    switch (action) {
      case 'disqualify':
        // Implement disqualification logic
        toast({
          title: "Participant disqualified",
          description: "The participant has been removed from the tournament.",
        });
        break;
      case 'check_in':
        const success = await tournamentManager.checkInParticipant(tournament.id, participantId);
        if (success) {
          toast({
            title: "Check-in successful",
            description: "Participant has been checked in manually.",
          });
          loadParticipants();
        }
        break;
      case 'message':
        toast({
          title: "Message feature",
          description: "Direct messaging would be implemented here.",
        });
        break;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'pending': { color: 'bg-gray-500', text: 'Pending' },
      'in_progress': { color: 'bg-orange-500 animate-pulse', text: 'Live' },
      'completed': { color: 'bg-green-500', text: 'Completed' },
      'forfeited': { color: 'bg-red-500', text: 'Forfeited' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <Badge className={`${config.color} text-white`}>
        {config.text}
      </Badge>
    );
  };

  const checkedInCount = participants.filter(p => p.checked_in).length;
  const checkInRate = participants.length > 0 ? (checkedInCount / participants.length) * 100 : 0;
  const eliminatedCount = participants.filter(p => p.eliminated).length;
  const activeMatches = matches.filter(m => m.status === 'in_progress').length;
  const completedMatches = matches.filter(m => m.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Tournament Administration
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                Manage participants, matches, and tournament settings
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Select value={tournament.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="registration_open">Registration Open</SelectItem>
                  <SelectItem value="registration_closed">Registration Closed</SelectItem>
                  <SelectItem value="check_in">Check-in Phase</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              
              {tournament.status === 'check_in' && (
                <Button onClick={handleGenerateBracket} disabled={loading}>
                  <Trophy className="h-4 w-4 mr-2" />
                  Generate Bracket
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 mx-auto mb-2 text-blue-500" />
            <p className="text-xl font-bold">{participants.length}</p>
            <p className="text-sm text-muted-foreground">Registered</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-500" />
            <p className="text-xl font-bold">{checkedInCount}</p>
            <p className="text-sm text-muted-foreground">Checked In</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Play className="h-6 w-6 mx-auto mb-2 text-orange-500" />
            <p className="text-xl font-bold">{activeMatches}</p>
            <p className="text-sm text-muted-foreground">Live Matches</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Trophy className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
            <p className="text-xl font-bold">{completedMatches}</p>
            <p className="text-sm text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Ban className="h-6 w-6 mx-auto mb-2 text-red-500" />
            <p className="text-xl font-bold">{eliminatedCount}</p>
            <p className="text-sm text-muted-foreground">Eliminated</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Eye className="h-6 w-6 mx-auto mb-2 text-purple-500" />
            <p className="text-xl font-bold">{analytics.totalViews.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Total Views</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="participants" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="participants">Participants</TabsTrigger>
          <TabsTrigger value="matches">Matches</TabsTrigger>
          <TabsTrigger value="bracket">Bracket</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Participants Tab */}
        <TabsContent value="participants" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Participant Management</h3>
              <p className="text-sm text-muted-foreground">
                {checkedInCount}/{participants.length} participants checked in ({checkInRate.toFixed(1)}%)
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export List
              </Button>
              <Button size="sm" variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Bulk Actions
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {participants.map((participant, index) => (
              <motion.div
                key={participant.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Seed</p>
                          <p className="font-bold">#{participant.seed}</p>
                        </div>
                        
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={participant.user?.avatar_url} />
                          <AvatarFallback>
                            {participant.user?.username?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <p className="font-medium">{participant.user?.display_name}</p>
                          <p className="text-sm text-muted-foreground">@{participant.user?.username}</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {participant.checked_in ? (
                            <Badge className="bg-green-500 text-white">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Checked In
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                          
                          {participant.eliminated && (
                            <Badge className="bg-red-500 text-white">
                              <Ban className="h-3 w-3 mr-1" />
                              Eliminated
                            </Badge>
                          )}
                          
                          {participant.placement && (
                            <Badge className="bg-yellow-500 text-white">
                              {participant.placement === 1 ? '🥇' : 
                               participant.placement === 2 ? '🥈' :
                               participant.placement === 3 ? '🥉' : 
                               `#${participant.placement}`}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {!participant.checked_in && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleParticipantAction(participant.participant_id, 'check_in')}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Check In
                          </Button>
                        )}
                        
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleParticipantAction(participant.participant_id, 'message')}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedParticipant(participant);
                            setShowEditDialog(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        {!participant.eliminated && (
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleParticipantAction(participant.participant_id, 'disqualify')}
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Matches Tab */}
        <TabsContent value="matches" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Match Management</h3>
            <div className="flex items-center gap-2">
              <Select defaultValue="all">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Matches</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="live">Live</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {matches.map((match, index) => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Round {match.round}</Badge>
                        {getStatusBadge(match.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">{match.bracket_position}</p>
                    </div>
                    
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-center flex-1">
                        <p className="font-medium">Player 1</p>
                        <p className="text-sm text-muted-foreground">
                          {participants.find(p => p.participant_id === match.participant1_id)?.user?.display_name || 'TBD'}
                        </p>
                      </div>
                      
                      <div className="px-4">
                        <p className="text-lg font-bold text-center">{match.score}</p>
                      </div>
                      
                      <div className="text-center flex-1">
                        <p className="font-medium">Player 2</p>
                        <p className="text-sm text-muted-foreground">
                          {participants.find(p => p.participant_id === match.participant2_id)?.user?.display_name || 'TBD'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        {match.scheduled_time && (
                          <p className="text-muted-foreground">
                            Scheduled: {new Date(match.scheduled_time).toLocaleTimeString()}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        {match.status === 'pending' && (
                          <Button size="sm" variant="outline">
                            <Play className="h-4 w-4 mr-1" />
                            Start
                          </Button>
                        )}
                        
                        {match.status === 'in_progress' && (
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4 mr-1" />
                            Update
                          </Button>
                        )}
                        
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Bracket Tab */}
        <TabsContent value="bracket" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tournament Bracket</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-semibold mb-2">Bracket Management</p>
                <p className="text-muted-foreground mb-4">
                  Interactive bracket editor and match management would be displayed here
                </p>
                <Button>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Bracket
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Registration Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Registration Rate</span>
                    <span className="font-semibold">{analytics.registrationRate}%</span>
                  </div>
                  <Progress value={analytics.registrationRate} />
                  
                  <div className="flex justify-between items-center">
                    <span>Check-in Rate</span>
                    <span className="font-semibold">{checkInRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={checkInRate} />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Viewership Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Views</span>
                    <span className="font-semibold">{analytics.totalViews.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Peak Viewers</span>
                    <span className="font-semibold">{analytics.peakViewers.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Match Duration</span>
                    <span className="font-semibold">{analytics.avgMatchDuration} min</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm">Tournament Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Advanced analytics charts would be displayed here
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tournament Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Tournament Name</Label>
                  <Input value={tournament.name} readOnly />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={tournament.status}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="registration_open">Registration Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label>Tournament Rules</Label>
                <Textarea 
                  className="min-h-[200px]" 
                  defaultValue="Tournament rules and regulations..."
                />
              </div>
              
              <div className="flex gap-3">
                <Button>Save Changes</Button>
                <Button variant="outline">Reset</Button>
                <Button variant="destructive">Delete Tournament</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Participant Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Participant</DialogTitle>
          </DialogHeader>
          {selectedParticipant && (
            <div className="space-y-4">
              <div>
                <Label>Seed Position</Label>
                <Input 
                  type="number" 
                  value={selectedParticipant.seed || ''} 
                  onChange={(e) => setSelectedParticipant({
                    ...selectedParticipant,
                    seed: parseInt(e.target.value) || undefined
                  })}
                />
              </div>
              
              <div>
                <Label>Status</Label>
                <Select 
                  value={selectedParticipant.checked_in ? 'checked_in' : 'registered'}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="registered">Registered</SelectItem>
                    <SelectItem value="checked_in">Checked In</SelectItem>
                    <SelectItem value="disqualified">Disqualified</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-3">
                <Button onClick={() => setShowEditDialog(false)}>
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
