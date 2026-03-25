"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

export interface Tournament {
  id: string;
  name: string;
  description: string;
  game_id: string;
  game: {
    id: string;
    name: string;
    cover_url: string;
  };
  format: 'single_elimination' | 'double_elimination' | 'round_robin' | 'swiss';
  max_participants: number;
  current_participants: number;
  entry_fee: number;
  prize_pool: number;
  status: 'upcoming' | 'registration' | 'in_progress' | 'completed';
  start_date: string;
  end_date?: string;
  registration_deadline: string;
  rules: string[];
  organizer_id: string;
  organizer: {
    id: string;
    username: string;
    display_name: string;
    avatar_url?: string;
  };
  brackets?: TournamentBracket;
  participants: TournamentParticipant[];
  created_at: string;
}

export interface TournamentParticipant {
  id: string;
  user_id: string;
  tournament_id: string;
  team_name?: string;
  registered_at: string;
  status: 'registered' | 'checked_in' | 'eliminated' | 'winner';
  user: {
    id: string;
    username: string;
    display_name: string;
    avatar_url?: string;
  };
}

export interface TournamentMatch {
  id: string;
  tournament_id: string;
  round: number;
  position: number;
  participant1_id?: string;
  participant2_id?: string;
  winner_id?: string;
  score?: string;
  status: 'pending' | 'in_progress' | 'completed';
  scheduled_at?: string;
  completed_at?: string;
}

export interface TournamentBracket {
  rounds: Array<{
    round: number;
    matches: TournamentMatch[];
  }>;
}

interface TournamentContextType {
  tournaments: Tournament[];
  myTournaments: Tournament[];
  loading: boolean;
  createTournament: (tournamentData: Partial<Tournament>) => Promise<Tournament>;
  joinTournament: (tournamentId: string, teamName?: string) => Promise<void>;
  leaveTournament: (tournamentId: string) => Promise<void>;
  updateMatch: (matchId: string, winnerId: string, score?: string) => Promise<void>;
  getTournament: (id: string) => Promise<Tournament | null>;
  searchTournaments: (query: string, filters?: any) => Promise<Tournament[]>;
}

const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

export const useTournaments = () => {
  const context = useContext(TournamentContext);
  if (!context) {
    throw new Error('useTournaments must be used within a TournamentProvider');
  }
  return context;
};

interface TournamentProviderProps {
  children: ReactNode;
}

export default function TournamentProvider({ children }: TournamentProviderProps) {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [myTournaments, setMyTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadTournaments();
      loadMyTournaments();
    } else {
      setTournaments([]);
      setMyTournaments([]);
      setLoading(false);
    }
  }, [user]);

  const loadTournaments = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('tournaments')
        .select(`
          *,
          game:games(id, name, cover_url),
          organizer:profiles!organizer_id(id, username, display_name, avatar_url),
          participants:tournament_participants(
            id,
            user_id,
            team_name,
            status,
            registered_at,
            user:profiles!user_id(id, username, display_name, avatar_url)
          )
        `)
        .in('status', ['upcoming', 'registration', 'in_progress'])
        .order('start_date', { ascending: true })
        .limit(50);

      if (error) throw error;

      const processedTournaments = (data || []).map(tournament => ({
        ...tournament,
        game: Array.isArray(tournament.game) ? tournament.game[0] : tournament.game,
        organizer: Array.isArray(tournament.organizer) ? tournament.organizer[0] : tournament.organizer,
        current_participants: tournament.participants?.length || 0
      }));

      setTournaments(processedTournaments);
    } catch (error) {
      console.error('Error loading tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMyTournaments = async () => {
    if (!user) return;

    try {
      const supabase = createClient();
      
      // Get tournaments I'm participating in
      const { data: participantData, error: participantError } = await supabase
        .from('tournament_participants')
        .select(`
          tournament:tournaments(
            *,
            game:games(id, name, cover_url),
            organizer:profiles!organizer_id(id, username, display_name, avatar_url)
          )
        `)
        .eq('user_id', user.id);

      if (participantError) throw participantError;

      // Get tournaments I'm organizing
      const { data: organizerData, error: organizerError } = await supabase
        .from('tournaments')
        .select(`
          *,
          game:games(id, name, cover_url),
          organizer:profiles!organizer_id(id, username, display_name, avatar_url)
        `)
        .eq('organizer_id', user.id);

      if (organizerError) throw organizerError;

      const participantTournaments = (participantData || []).map(p => {
        const tournament = p.tournament;
        if (!tournament || Array.isArray(tournament)) return null;
        
        const tournamentObj = tournament as any;
        return {
          ...tournamentObj,
          game: Array.isArray(tournamentObj.game) ? tournamentObj.game[0] : tournamentObj.game || null,
          organizer: Array.isArray(tournamentObj.organizer) ? tournamentObj.organizer[0] : tournamentObj.organizer || null
        } as Tournament;
      }).filter((t): t is Tournament => t !== null);

      const organizerTournaments = (organizerData || []).map(tournament => {
        if (!tournament || Array.isArray(tournament)) return null;
        
        const tournamentObj = tournament as any;
        return {
          ...tournamentObj,
          game: Array.isArray(tournamentObj.game) ? tournamentObj.game[0] : tournamentObj.game || null,
          organizer: Array.isArray(tournamentObj.organizer) ? tournamentObj.organizer[0] : tournamentObj.organizer || null
        } as Tournament;
      }).filter((t): t is Tournament => t !== null);

      // Combine and deduplicate
      const allMyTournaments = [...participantTournaments, ...organizerTournaments];
      const uniqueTournaments = allMyTournaments.filter((tournament, index, self) => 
        index === self.findIndex(t => t.id === tournament.id)
      );

      setMyTournaments(uniqueTournaments);
    } catch (error) {
      console.error('Error loading my tournaments:', error);
    }
  };

  const createTournament = async (tournamentData: Partial<Tournament>): Promise<Tournament> => {
    if (!user) throw new Error('Must be authenticated to create tournaments');

    const supabase = createClient();
    const { data, error } = await supabase
      .from('tournaments')
      .insert({
        ...tournamentData,
        organizer_id: user.id,
        status: 'upcoming',
        current_participants: 0
      })
      .select(`
        *,
        game:games(id, name, cover_url),
        organizer:profiles!organizer_id(id, username, display_name, avatar_url)
      `)
      .single();

    if (error) throw error;

    const processedTournament = {
      ...data,
      game: Array.isArray(data.game) ? data.game[0] : data.game,
      organizer: Array.isArray(data.organizer) ? data.organizer[0] : data.organizer,
      participants: []
    };

    setTournaments(prev => [processedTournament, ...prev]);
    setMyTournaments(prev => [processedTournament, ...prev]);

    toast({
      title: "Tournament created!",
      description: `${processedTournament.name} has been created successfully.`,
    });

    return processedTournament;
  };

  const joinTournament = async (tournamentId: string, teamName?: string) => {
    if (!user) throw new Error('Must be authenticated to join tournaments');

    try {
      const supabase = createClient();
      
      // Check if already registered
      const { data: existing } = await supabase
        .from('tournament_participants')
        .select('id')
        .eq('tournament_id', tournamentId)
        .eq('user_id', user.id)
        .single();

      if (existing) {
        throw new Error('Already registered for this tournament');
      }

      // Register for tournament
      const { error } = await supabase
        .from('tournament_participants')
        .insert({
          tournament_id: tournamentId,
          user_id: user.id,
          team_name: teamName,
          status: 'registered'
        });

      if (error) throw error;

      // Refresh tournaments
      await Promise.all([loadTournaments(), loadMyTournaments()]);

      toast({
        title: "Successfully joined!",
        description: "You have been registered for the tournament.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to join tournament",
        description: error.message || "Please try again.",
        variant: "destructive"
      });
    }
  };

  const leaveTournament = async (tournamentId: string) => {
    if (!user) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('tournament_participants')
        .delete()
        .eq('tournament_id', tournamentId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Refresh tournaments
      await Promise.all([loadTournaments(), loadMyTournaments()]);

      toast({
        title: "Left tournament",
        description: "You have been removed from the tournament.",
      });
    } catch (error) {
      toast({
        title: "Failed to leave tournament",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const updateMatch = async (matchId: string, winnerId: string, score?: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('tournament_matches')
        .update({
          winner_id: winnerId,
          score: score,
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', matchId);

      if (error) throw error;

      toast({
        title: "Match updated",
        description: "Match result has been recorded.",
      });
    } catch (error) {
      toast({
        title: "Failed to update match",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const getTournament = async (id: string): Promise<Tournament | null> => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('tournaments')
        .select(`
          *,
          game:games(id, name, cover_url),
          organizer:profiles!organizer_id(id, username, display_name, avatar_url),
          participants:tournament_participants(
            id,
            user_id,
            team_name,
            status,
            registered_at,
            user:profiles!user_id(id, username, display_name, avatar_url)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        ...data,
        game: Array.isArray(data.game) ? data.game[0] : data.game,
        organizer: Array.isArray(data.organizer) ? data.organizer[0] : data.organizer,
        current_participants: data.participants?.length || 0
      };
    } catch (error) {
      console.error('Error getting tournament:', error);
      return null;
    }
  };

  const searchTournaments = async (query: string, filters?: any): Promise<Tournament[]> => {
    try {
      const supabase = createClient();
      let queryBuilder = supabase
        .from('tournaments')
        .select(`
          *,
          game:games(id, name, cover_url),
          organizer:profiles!organizer_id(id, username, display_name, avatar_url)
        `)
        .ilike('name', `%${query}%`)
        .limit(20);

      if (filters?.status) {
        queryBuilder = queryBuilder.eq('status', filters.status);
      }

      if (filters?.game_id) {
        queryBuilder = queryBuilder.eq('game_id', filters.game_id);
      }

      const { data, error } = await queryBuilder;

      if (error) throw error;

      return (data || []).map(tournament => ({
        ...tournament,
        game: Array.isArray(tournament.game) ? tournament.game[0] : tournament.game,
        organizer: Array.isArray(tournament.organizer) ? tournament.organizer[0] : tournament.organizer,
        current_participants: 0, // Would need to fetch participant count
        participants: []
      }));
    } catch (error) {
      console.error('Error searching tournaments:', error);
      return [];
    }
  };

  const value = {
    tournaments,
    myTournaments,
    loading,
    createTournament,
    joinTournament,
    leaveTournament,
    updateMatch,
    getTournament,
    searchTournaments,
  };

  return (
    <TournamentContext.Provider value={value}>
      {children}
    </TournamentContext.Provider>
  );
}
