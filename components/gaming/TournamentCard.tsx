'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, 
  Users, 
  Calendar, 
  DollarSign, 
  Clock, 
  Target,
  Medal,
  Crown
} from 'lucide-react';
import { Tournament } from '@/lib/gaming/game-api-manager';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface TournamentCardProps {
  tournament: Tournament;
  onJoin?: (tournamentId: string) => void;
  onView?: (tournamentId: string) => void;
  canJoin?: boolean;
  userParticipating?: boolean;
}

export function TournamentCard({ 
  tournament, 
  onJoin, 
  onView, 
  canJoin = false,
  userParticipating = false 
}: TournamentCardProps) {
  const [isJoining, setIsJoining] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-500';
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-gray-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'single_elimination': return <Target className="h-4 w-4" />;
      case 'double_elimination': return <Medal className="h-4 w-4" />;
      case 'round_robin': return <Users className="h-4 w-4" />;
      case 'swiss': return <Crown className="h-4 w-4" />;
      default: return <Trophy className="h-4 w-4" />;
    }
  };

  const handleJoinTournament = async () => {
    if (!onJoin || isJoining) return;

    setIsJoining(true);
    try {
      await onJoin(tournament.id);
      toast.success('Successfully joined tournament!');
    } catch (error) {
      toast.error('Failed to join tournament');
      console.error('Error joining tournament:', error);
    } finally {
      setIsJoining(false);
    }
  };

  const participantProgress = (tournament.participants.length / tournament.maxParticipants) * 100;
  const spotsRemaining = tournament.maxParticipants - tournament.participants.length;

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-bold">{tournament.name}</CardTitle>
              <Badge 
                variant="secondary" 
                className={`${getStatusColor(tournament.status)} text-white text-xs`}
              >
                {tournament.status.toUpperCase()}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {tournament.description}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {getFormatIcon(tournament.format)}
            <span className="text-xs text-muted-foreground capitalize">
              {tournament.format.replace('_', ' ')}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Tournament Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{tournament.participants.length}/{tournament.maxParticipants}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{format(new Date(tournament.startDate), 'MMM dd, HH:mm')}</span>
          </div>
          
          {tournament.entryFee && (
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span>${tournament.entryFee}</span>
            </div>
          )}
          
          {tournament.prizePool && (
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold text-green-600">${tournament.prizePool}</span>
            </div>
          )}
        </div>

        {/* Participant Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Participants</span>
            <span className="text-muted-foreground">
              {spotsRemaining > 0 ? `${spotsRemaining} spots left` : 'Full'}
            </span>
          </div>
          <Progress value={participantProgress} className="h-2" />
        </div>

        {/* Recent Participants */}
        {tournament.participants.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Recent Participants</p>
            <div className="flex -space-x-2">
              {tournament.participants.slice(0, 5).map((participant) => (
                <Avatar key={participant.userId} className="h-8 w-8 border-2 border-background">
                  <AvatarImage src={`/avatars/${participant.userId}.png`} />
                  <AvatarFallback className="text-xs">
                    {participant.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
              {tournament.participants.length > 5 && (
                <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                  <span className="text-xs font-medium">
                    +{tournament.participants.length - 5}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Time until start */}
        {tournament.status === 'upcoming' && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              Starts {format(new Date(tournament.startDate), 'MMM dd, yyyy at HH:mm')}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {tournament.status === 'upcoming' && canJoin && !userParticipating && spotsRemaining > 0 && (
            <Button 
              onClick={handleJoinTournament}
              disabled={isJoining}
              className="flex-1"
            >
              {isJoining ? 'Joining...' : 'Join Tournament'}
            </Button>
          )}
          
          {userParticipating && (
            <Badge variant="outline" className="px-3 py-1">
              Participating
            </Badge>
          )}
          
          {tournament.status === 'completed' && (
            <Badge variant="secondary" className="px-3 py-1">
              Completed
            </Badge>
          )}
          
          <Button 
            variant="outline" 
            onClick={() => onView?.(tournament.id)}
            className="flex-1"
          >
            View Details
          </Button>
        </div>

        {/* Tournament Rules Preview */}
        {tournament.rules && (
          <details className="text-sm">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              Tournament Rules
            </summary>
            <p className="mt-2 text-xs text-muted-foreground line-clamp-3">
              {tournament.rules}
            </p>
          </details>
        )}
      </CardContent>
    </Card>
  );
}
