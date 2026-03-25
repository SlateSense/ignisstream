import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Tournament {
  id: string;
  name: string;
  description: string;
  game_id: string;
  status: 'registration' | 'check_in' | 'in_progress' | 'completed' | 'cancelled';
  max_participants: number;
  current_participants: number;
  tournament_start: string;
  tournament_end?: string;
  registration_deadline: string;
  entry_fee?: number;
  prize_pool: number;
  bracket_type: 'single_elimination' | 'double_elimination' | 'round_robin';
  organizer_id: string;
  rules: string;
  stream_url?: string;
  created_at: string;
}

interface Match {
  id: string;
  tournament_id: string;
  round: number;
  position: number;
  team1_id?: string;
  team2_id?: string;
  winner_id?: string;
  team1_score?: number;
  team2_score?: number;
  status: 'upcoming' | 'live' | 'completed';
  scheduled_time?: string;
  actual_start?: string;
  actual_end?: string;
  stream_url?: string;
  // Populated relations
  team1?: {
    id: string;
    name: string;
    logo?: string;
  };
  team2?: {
    id: string;
    name: string;
    logo?: string;
  };
}

export const useTournament = (tournamentId: string) => {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tournamentId) {
      fetchTournament();
      fetchMatches();
      subscribeToUpdates();
    }
  }, [tournamentId]);

  const fetchTournament = async () => {
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select(`
          *,
          game:games(id, name, cover_url),
          organizer:profiles(id, username, display_name)
        `)
        .eq('id', tournamentId)
        .single();

      if (error) throw error;
      setTournament(data);
    } catch (err) {
      console.error('Error fetching tournament:', err);
      setError('Failed to load tournament');
    }
  };

  const fetchMatches = async () => {
    try {
      const { data, error } = await supabase
        .from('tournament_matches')
        .select(`
          *,
          team1:tournament_teams!team1_id(
            id,
            team_name,
            logo_url
          ),
          team2:tournament_teams!team2_id(
            id,
            team_name,
            logo_url
          )
        `)
        .eq('tournament_id', tournamentId)
        .order('round', { ascending: true })
        .order('position', { ascending: true });

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedMatches = data?.map(match => ({
        id: match.id,
        tournament_id: match.tournament_id,
        round: match.round,
        position: match.position,
        team1_id: match.team1_id,
        team2_id: match.team2_id,
        winner_id: match.winner_id,
        team1_score: match.team1_score,
        team2_score: match.team2_score,
        status: match.status,
        scheduled_time: match.scheduled_time,
        actual_start: match.actual_start,
        actual_end: match.actual_end,
        stream_url: match.stream_url,
        team1: match.team1 ? {
          id: match.team1.id,
          name: match.team1.team_name,
          logo: match.team1.logo_url
        } : undefined,
        team2: match.team2 ? {
          id: match.team2.id,
          name: match.team2.team_name,
          logo: match.team2.logo_url
        } : undefined
      })) || [];

      setMatches(transformedMatches);
    } catch (err) {
      console.error('Error fetching matches:', err);
      setError('Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToUpdates = () => {
    // Subscribe to tournament updates
    const tournamentChannel = supabase
      .channel(`tournament_${tournamentId}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournaments',
          filter: `id=eq.${tournamentId}`
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setTournament(prev => prev ? { ...prev, ...payload.new } : null);
          }
        }
      )
      .subscribe();

    // Subscribe to match updates
    const matchesChannel = supabase
      .channel(`tournament_matches_${tournamentId}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournament_matches',
          filter: `tournament_id=eq.${tournamentId}`
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setMatches(prev => prev.map(match => 
              match.id === payload.new.id 
                ? { ...match, ...payload.new }
                : match
            ));
          } else if (payload.eventType === 'INSERT') {
            // Refetch matches to get populated relations
            fetchMatches();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tournamentChannel);
      supabase.removeChannel(matchesChannel);
    };
  };

  const refreshTournament = async () => {
    setLoading(true);
    setError(null);
    await Promise.all([fetchTournament(), fetchMatches()]);
  };

  const getMatchById = (matchId: string) => {
    return matches.find(match => match.id === matchId);
  };

  const getMatchesForRound = (round: number) => {
    return matches.filter(match => match.round === round);
  };

  const getLiveMatches = () => {
    return matches.filter(match => match.status === 'live');
  };

  const getUpcomingMatches = () => {
    return matches.filter(match => match.status === 'upcoming');
  };

  const getTournamentProgress = () => {
    if (!matches.length) return 0;
    
    const completedMatches = matches.filter(match => match.status === 'completed').length;
    return (completedMatches / matches.length) * 100;
  };

  const getCurrentRound = () => {
    const liveMatch = matches.find(match => match.status === 'live');
    if (liveMatch) return liveMatch.round;
    
    const upcomingMatch = matches.find(match => match.status === 'upcoming');
    if (upcomingMatch) return upcomingMatch.round;
    
    const completedMatches = matches.filter(match => match.status === 'completed');
    if (completedMatches.length > 0) {
      return Math.max(...completedMatches.map(match => match.round)) + 1;
    }
    
    return 1;
  };

  return {
    tournament,
    matches,
    loading,
    error,
    refreshTournament,
    getMatchById,
    getMatchesForRound,
    getLiveMatches,
    getUpcomingMatches,
    getTournamentProgress,
    getCurrentRound
  };
};
