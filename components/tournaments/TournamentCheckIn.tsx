"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Users, 
  Calendar,
  Timer,
  User,
  Gamepad2,
  Shield,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Tournament, TournamentParticipant, tournamentManager } from '@/lib/tournaments/tournament-manager';

interface TournamentCheckInProps {
  tournament: Tournament;
  participant?: TournamentParticipant;
  onCheckInComplete: () => void;
}

export default function TournamentCheckIn({ tournament, participant, onCheckInComplete }: TournamentCheckInProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [allParticipants, setAllParticipants] = useState<TournamentParticipant[]>([]);
  const [checkedInCount, setCheckedInCount] = useState(0);

  useEffect(() => {
    const checkInEnd = new Date(tournament.check_in_end);
    const now = new Date();
    
    const updateTimer = () => {
      const timeLeft = checkInEnd.getTime() - Date.now();
      setTimeRemaining(Math.max(0, timeLeft));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [tournament.check_in_end]);

  useEffect(() => {
    loadParticipants();
  }, [tournament.id]);

  const loadParticipants = async () => {
    // In a real implementation, you'd fetch all participants
    // For now, we'll simulate this
    const mockParticipants: TournamentParticipant[] = [
      {
        id: '1',
        tournament_id: tournament.id,
        participant_id: user?.id || '',
        participant_type: 'user',
        registration_date: new Date().toISOString(),
        checked_in: participant?.checked_in || false,
        eliminated: false
      }
    ];
    
    setAllParticipants(mockParticipants);
    setCheckedInCount(mockParticipants.filter(p => p.checked_in).length);
  };

  const canCheckIn = () => {
    const now = new Date();
    const checkInStart = new Date(tournament.check_in_start);
    const checkInEnd = new Date(tournament.check_in_end);
    
    return (
      tournament.status === 'check_in' &&
      now >= checkInStart &&
      now <= checkInEnd &&
      participant &&
      !participant.checked_in
    );
  };

  const getCheckInStatus = () => {
    const now = new Date();
    const checkInStart = new Date(tournament.check_in_start);
    const checkInEnd = new Date(tournament.check_in_end);
    
    if (now < checkInStart) {
      return {
        status: 'not_started',
        message: 'Check-in has not started yet',
        color: 'bg-gray-500'
      };
    }
    
    if (now > checkInEnd) {
      return {
        status: 'ended',
        message: 'Check-in period has ended',
        color: 'bg-red-500'
      };
    }
    
    if (participant?.checked_in) {
      return {
        status: 'checked_in',
        message: 'Successfully checked in',
        color: 'bg-green-500'
      };
    }
    
    return {
      status: 'open',
      message: 'Check-in is open',
      color: 'bg-blue-500'
    };
  };

  const formatTimeRemaining = (ms: number) => {
    if (ms <= 0) return 'Time expired';
    
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const handleCheckIn = async () => {
    if (!user || !participant) return;
    
    setIsCheckingIn(true);
    
    try {
      const success = await tournamentManager.checkInParticipant(
        tournament.id,
        participant.participant_id
      );
      
      if (!success) {
        throw new Error('Failed to check in');
      }
      
      toast({
        title: "Check-in successful!",
        description: "You are now checked in for the tournament.",
      });
      
      onCheckInComplete();
      await loadParticipants();
    } catch (error) {
      console.error('Check-in error:', error);
      toast({
        title: "Check-in failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    } finally {
      setIsCheckingIn(false);
    }
  };

  const checkInStatus = getCheckInStatus();
  const checkedInPercentage = tournament.current_participants > 0 
    ? (checkedInCount / tournament.current_participants) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Check-in Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                Tournament Check-In
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                Verify your participation before the tournament begins
              </p>
            </div>
            <Badge className={`${checkInStatus.color} text-white`}>
              {checkInStatus.message}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Check-in Timer */}
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Time Remaining</h3>
                <div className="text-3xl font-bold text-primary">
                  {formatTimeRemaining(timeRemaining)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Check-in ends at {new Date(tournament.check_in_end).toLocaleTimeString()}
                </p>
              </div>
              
              {timeRemaining > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Time Progress</span>
                    <span>{Math.round(100 - (timeRemaining / (60 * 60 * 1000)) * 100)}%</span>
                  </div>
                  <Progress 
                    value={100 - (timeRemaining / (60 * 60 * 1000)) * 100} 
                    className="h-2"
                  />
                </div>
              )}
            </div>
            
            {/* Check-in Statistics */}
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Participants Status</h3>
                <div className="text-3xl font-bold text-green-500">
                  {checkedInCount}/{tournament.current_participants}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Players checked in
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Check-in Rate</span>
                  <span>{Math.round(checkedInPercentage)}%</span>
                </div>
                <Progress value={checkedInPercentage} className="h-2" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Check-in Action */}
      {participant && (
        <Card>
          <CardHeader>
            <CardTitle>Your Check-In Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-6 bg-secondary/20 rounded-lg">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  participant.checked_in ? 'bg-green-500' : 'bg-gray-500'
                }`}>
                  {participant.checked_in ? (
                    <CheckCircle className="h-6 w-6 text-white" />
                  ) : (
                    <Clock className="h-6 w-6 text-white" />
                  )}
                </div>
                
                <div>
                  <h3 className="font-semibold">
                    {participant.checked_in ? 'Checked In' : 'Pending Check-In'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {participant.checked_in 
                      ? `Checked in at ${participant.check_in_time ? new Date(participant.check_in_time).toLocaleTimeString() : 'Unknown'}`
                      : 'Click the button to check in'
                    }
                  </p>
                </div>
              </div>
              
              {!participant.checked_in && (
                <Button
                  onClick={handleCheckIn}
                  disabled={!canCheckIn() || isCheckingIn}
                  className="bg-gradient-to-r from-gaming-purple to-gaming-pink hover:opacity-90"
                  size="lg"
                >
                  {isCheckingIn ? (
                    <>
                      <Timer className="h-4 w-4 mr-2 animate-spin" />
                      Checking In...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Check In Now
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tournament Details */}
      <Card>
        <CardHeader>
          <CardTitle>Tournament Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-secondary/20 rounded-lg">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Tournament Start</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(tournament.tournament_start).toLocaleString()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-secondary/20 rounded-lg">
              <Gamepad2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Format</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {tournament.format} • {tournament.bracket_type.replace('_', ' ')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-secondary/20 rounded-lg">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Prize Pool</p>
                <p className="text-sm text-muted-foreground">
                  ${tournament.prize_pool.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Important Notices */}
      <div className="space-y-4">
        {!participant?.checked_in && timeRemaining > 0 && (
          <Alert>
            <Zap className="h-4 w-4" />
            <AlertDescription>
              <strong>Action Required:</strong> You must check in during the specified time window to participate in the tournament.
            </AlertDescription>
          </Alert>
        )}
        
        {timeRemaining <= 300000 && timeRemaining > 0 && !participant?.checked_in && (
          <Alert className="border-orange-500 bg-orange-500/10">
            <AlertCircle className="h-4 w-4 text-orange-500" />
            <AlertDescription className="text-orange-700 dark:text-orange-300">
              <strong>Warning:</strong> Less than 5 minutes remaining to check in!
            </AlertDescription>
          </Alert>
        )}
        
        {timeRemaining <= 0 && !participant?.checked_in && (
          <Alert className="border-red-500 bg-red-500/10">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-700 dark:text-red-300">
              <strong>Check-in Closed:</strong> You missed the check-in window and will not be able to participate.
            </AlertDescription>
          </Alert>
        )}
        
        {participant?.checked_in && (
          <Alert className="border-green-500 bg-green-500/10">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-700 dark:text-green-300">
              <strong>Ready to Play:</strong> You're all set! The tournament will begin at the scheduled time.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* What's Next */}
      {participant?.checked_in && (
        <Card>
          <CardHeader>
            <CardTitle>What's Next?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold">1</span>
                </div>
                <p>Wait for the tournament to begin at {new Date(tournament.tournament_start).toLocaleTimeString()}</p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold">2</span>
                </div>
                <p>Brackets will be generated and you'll receive your first match assignment</p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold">3</span>
                </div>
                <p>Join your match lobby and compete for the prize pool!</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
