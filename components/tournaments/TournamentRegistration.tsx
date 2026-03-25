"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Calendar, 
  Trophy, 
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  UserPlus,
  Shield,
  Gamepad2,
  Star
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Tournament, tournamentManager } from '@/lib/tournaments/tournament-manager';

interface TeamMember {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  role: 'captain' | 'player' | 'substitute';
  skill_rating?: number;
}

interface TournamentRegistrationProps {
  tournament: Tournament;
  onRegistrationComplete: () => void;
}

export default function TournamentRegistration({ tournament, onRegistrationComplete }: TournamentRegistrationProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [registrationStep, setRegistrationStep] = useState(1);
  const [isRegistering, setIsRegistering] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [acceptRules, setAcceptRules] = useState(false);
  
  const isSoloTournament = tournament.format === 'solo';
  const isTeamTournament = tournament.format === 'team';
  const isDuoTournament = tournament.format === 'duo';
  
  const requiredMembers = isDuoTournament ? 2 : isTeamTournament ? 5 : 1;
  const maxMembers = isTeamTournament ? 7 : isDuoTournament ? 2 : 1; // Including substitutes

  useEffect(() => {
    if (user && isSoloTournament) {
      setTeamMembers([{
        user_id: user.id,
        username: user.user_metadata?.username || user.email || '',
        display_name: user.user_metadata?.display_name || user.email || '',
        avatar_url: user.user_metadata?.avatar_url,
        role: 'captain'
      }]);
    }
  }, [user, isSoloTournament]);

  const canRegister = () => {
    if (tournament.status !== 'registration_open') return false;
    if (tournament.current_participants >= tournament.max_participants) return false;
    if (new Date() > new Date(tournament.registration_end)) return false;
    return true;
  };

  const getRegistrationStatus = () => {
    const now = new Date();
    const regStart = new Date(tournament.registration_start);
    const regEnd = new Date(tournament.registration_end);
    
    if (now < regStart) return { status: 'not_started', message: 'Registration not started yet' };
    if (now > regEnd) return { status: 'ended', message: 'Registration has ended' };
    if (tournament.current_participants >= tournament.max_participants) {
      return { status: 'full', message: 'Tournament is full' };
    }
    return { status: 'open', message: 'Registration is open' };
  };

  const addTeamMember = async (memberData: Partial<TeamMember>) => {
    if (teamMembers.length >= maxMembers) {
      toast({
        title: "Team full",
        description: `Maximum ${maxMembers} members allowed`,
        variant: "destructive"
      });
      return;
    }

    const newMember: TeamMember = {
      user_id: memberData.user_id || '',
      username: memberData.username || '',
      display_name: memberData.display_name || '',
      avatar_url: memberData.avatar_url,
      role: teamMembers.length === 0 ? 'captain' : 'player'
    };

    setTeamMembers([...teamMembers, newMember]);
  };

  const removeTeamMember = (userId: string) => {
    setTeamMembers(teamMembers.filter(member => member.user_id !== userId));
  };

  const updateMemberRole = (userId: string, role: 'captain' | 'player' | 'substitute') => {
    setTeamMembers(teamMembers.map(member => 
      member.user_id === userId ? { ...member, role } : member
    ));
  };

  const handleRegistration = async () => {
    if (!user) return;
    
    setIsRegistering(true);
    
    try {
      // Validate registration
      if (teamMembers.length < requiredMembers) {
        throw new Error(`Minimum ${requiredMembers} members required`);
      }
      
      if (!acceptRules) {
        throw new Error('You must accept the tournament rules');
      }

      // For team tournaments, create or use existing team
      let participantId = user.id;
      let participantType: 'user' | 'team' = 'user';

      if (isTeamTournament || isDuoTournament) {
        // Create team entry (simplified - would need proper team management)
        participantType = 'team';
        // In a real implementation, you'd create a team record and get its ID
        participantId = `team_${Date.now()}`;
      }

      // Register with tournament
      const success = await tournamentManager.registerParticipant(
        tournament.id,
        participantId,
        participantType
      );

      if (!success) {
        throw new Error('Failed to register for tournament');
      }

      toast({
        title: "Registration successful!",
        description: "You have been registered for the tournament.",
      });

      onRegistrationComplete();
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const registrationStatus = getRegistrationStatus();
  const progressPercentage = Math.min((tournament.current_participants / tournament.max_participants) * 100, 100);

  return (
    <div className="space-y-6">
      {/* Tournament Info Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                {tournament.name}
              </CardTitle>
              <p className="text-muted-foreground mt-1">{tournament.description}</p>
            </div>
            <Badge 
              variant={registrationStatus.status === 'open' ? 'default' : 'secondary'}
              className={registrationStatus.status === 'open' ? 'bg-green-500' : ''}
            >
              {registrationStatus.message}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Format</p>
                <p className="font-medium capitalize">{tournament.format}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Prize Pool</p>
                <p className="font-medium">${tournament.prize_pool.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Starts</p>
                <p className="font-medium">
                  {new Date(tournament.tournament_start).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Entry Fee</p>
                <p className="font-medium">
                  {tournament.entry_fee ? `$${tournament.entry_fee}` : 'Free'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Registration Progress */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Participants</span>
              <span>{tournament.current_participants}/{tournament.max_participants}</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Registration Form */}
      {canRegister() && (
        <Card>
          <CardHeader>
            <CardTitle>Tournament Registration</CardTitle>
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                    registrationStep >= step 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-secondary text-muted-foreground'
                  }`}>
                    {step}
                  </div>
                  {step < 3 && <div className="w-8 h-px bg-secondary mx-2" />}
                </div>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {/* Step 1: Team Setup */}
            {registrationStep === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold mb-2">
                    {isSoloTournament ? 'Player Registration' : 'Team Setup'}
                  </h3>
                  <p className="text-muted-foreground">
                    {isSoloTournament 
                      ? 'Verify your player information'
                      : `Set up your team (${requiredMembers}-${maxMembers} members)`
                    }
                  </p>
                </div>

                {!isSoloTournament && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="teamName">Team Name</Label>
                      <Input
                        id="teamName"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        placeholder="Enter your team name"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="teamDescription">Team Description (Optional)</Label>
                      <Textarea
                        id="teamDescription"
                        value={teamDescription}
                        onChange={(e) => setTeamDescription(e.target.value)}
                        placeholder="Tell us about your team..."
                        rows={3}
                      />
                    </div>
                  </div>
                )}

                {/* Team Members List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">
                      {isSoloTournament ? 'Player' : 'Team Members'} 
                      ({teamMembers.length}/{maxMembers})
                    </h4>
                    {!isSoloTournament && teamMembers.length < maxMembers && (
                      <Button size="sm" variant="outline">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Member
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    {teamMembers.map((member, index) => (
                      <div key={member.user_id} className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={member.avatar_url} />
                            <AvatarFallback>
                              {member.username[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.display_name}</p>
                            <p className="text-sm text-muted-foreground">@{member.username}</p>
                          </div>
                          <Badge variant={member.role === 'captain' ? 'default' : 'secondary'}>
                            {member.role}
                          </Badge>
                        </div>
                        
                        {!isSoloTournament && (
                          <div className="flex items-center gap-2">
                            <Select 
                              value={member.role} 
                              onValueChange={(role: any) => updateMemberRole(member.user_id, role)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="captain">Captain</SelectItem>
                                <SelectItem value="player">Player</SelectItem>
                                <SelectItem value="substitute">Sub</SelectItem>
                              </SelectContent>
                            </Select>
                            
                            {member.user_id !== user?.id && (
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => removeTeamMember(member.user_id)}
                              >
                                Remove
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {teamMembers.length < requiredMembers && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        You need at least {requiredMembers} member{requiredMembers > 1 ? 's' : ''} to register.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <Button 
                  onClick={() => setRegistrationStep(2)}
                  disabled={teamMembers.length < requiredMembers}
                  className="w-full"
                >
                  Continue to Rules
                </Button>
              </motion.div>
            )}

            {/* Step 2: Rules & Contact */}
            {registrationStep === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold mb-2">Tournament Rules & Contact</h3>
                  <p className="text-muted-foreground">
                    Please review the rules and provide contact information
                  </p>
                </div>

                <div>
                  <Label htmlFor="emergencyContact">Emergency Contact</Label>
                  <Input
                    id="emergencyContact"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    placeholder="Phone number or email for emergencies"
                  />
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Tournament Rules</CardTitle>
                  </CardHeader>
                  <CardContent className="max-h-60 overflow-y-auto">
                    <div className="prose prose-sm dark:prose-invert">
                      <div dangerouslySetInnerHTML={{ __html: tournament.rules }} />
                    </div>
                  </CardContent>
                </Card>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="acceptRules"
                    checked={acceptRules}
                    onChange={(e) => setAcceptRules(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="acceptRules" className="text-sm">
                    I have read and accept the tournament rules and code of conduct
                  </Label>
                </div>

                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setRegistrationStep(1)}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={() => setRegistrationStep(3)}
                    disabled={!acceptRules || !emergencyContact}
                    className="flex-1"
                  >
                    Continue to Payment
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Payment & Confirmation */}
            {registrationStep === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold mb-2">Registration Summary</h3>
                  <p className="text-muted-foreground">
                    Review your registration details and complete payment
                  </p>
                </div>

                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Tournament</span>
                        <span className="font-medium">{tournament.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Format</span>
                        <span className="capitalize">{tournament.format}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Members</span>
                        <span>{teamMembers.length}</span>
                      </div>
                      {tournament.entry_fee && (
                        <>
                          <hr />
                          <div className="flex justify-between font-medium">
                            <span>Entry Fee</span>
                            <span>${tournament.entry_fee}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {tournament.entry_fee ? (
                  <Alert>
                    <DollarSign className="h-4 w-4" />
                    <AlertDescription>
                      Payment will be processed through our secure payment system.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      This tournament is free to enter!
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setRegistrationStep(2)}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={handleRegistration}
                    disabled={isRegistering}
                    className="flex-1 bg-gradient-to-r from-gaming-purple to-gaming-pink hover:opacity-90"
                  >
                    {isRegistering ? 'Registering...' : 'Complete Registration'}
                  </Button>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Registration Closed Message */}
      {!canRegister() && (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Registration Closed</h3>
            <p className="text-muted-foreground">
              {registrationStatus.message}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
