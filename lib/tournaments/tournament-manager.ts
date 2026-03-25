import { createClient } from '@/lib/supabase/client';

export type TournamentStatus = 'draft' | 'registration_open' | 'registration_closed' | 'check_in' | 'in_progress' | 'completed' | 'cancelled';
export type BracketType = 'single_elimination' | 'double_elimination' | 'round_robin' | 'swiss';
export type TournamentFormat = 'solo' | 'team' | 'duo';

export interface Tournament {
  id: string;
  name: string;
  description: string;
  game_id: string;
  organizer_id: string;
  status: TournamentStatus;
  format: TournamentFormat;
  bracket_type: BracketType;
  max_participants: number;
  current_participants: number;
  entry_fee?: number;
  prize_pool: number;
  sponsor_prize_pool?: number;
  registration_start: string;
  registration_end: string;
  check_in_start: string;
  check_in_end: string;
  tournament_start: string;
  tournament_end?: string;
  rules: string;
  stream_url?: string;
  created_at: string;
  updated_at: string;
  
  // Relations
  game?: any;
  organizer?: any;
  participants?: TournamentParticipant[];
  brackets?: TournamentBracket[];
  matches?: TournamentMatch[];
  sponsors?: TournamentSponsor[];
}

export interface TournamentParticipant {
  id: string;
  tournament_id: string;
  participant_id: string; // user_id or team_id
  participant_type: 'user' | 'team';
  registration_date: string;
  checked_in: boolean;
  check_in_time?: string;
  seed?: number;
  eliminated: boolean;
  placement?: number;
  
  // Relations
  user?: any;
  team?: any;
}

export interface TournamentBracket {
  id: string;
  tournament_id: string;
  bracket_data: any; // JSON structure for bracket
  created_at: string;
  updated_at: string;
}

export interface TournamentMatch {
  id: string;
  tournament_id: string;
  bracket_position: string;
  round: number;
  participant1_id?: string;
  participant2_id?: string;
  winner_id?: string;
  score: string;
  status: 'pending' | 'in_progress' | 'completed' | 'forfeited';
  scheduled_time?: string;
  started_at?: string;
  completed_at?: string;
  stream_url?: string;
  
  // Relations
  participant1?: TournamentParticipant;
  participant2?: TournamentParticipant;
  winner?: TournamentParticipant;
}

export interface TournamentSponsor {
  id: string;
  tournament_id: string;
  sponsor_name: string;
  sponsor_logo: string;
  sponsor_url?: string;
  contribution_amount: number;
  sponsor_tier: 'title' | 'presenting' | 'official' | 'supporting';
  created_at: string;
}

export interface PrizeDistribution {
  placement: number;
  amount: number;
  percentage: number;
}

export class TournamentManager {
  private supabase = createClient();

  // Tournament CRUD Operations
  async createTournament(tournamentData: Partial<Tournament>): Promise<Tournament | null> {
    try {
      const { data, error } = await this.supabase
        .from('tournaments')
        .insert({
          ...tournamentData,
          status: 'draft',
          current_participants: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select(`
          *,
          game:games(*),
          organizer:profiles(*)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating tournament:', error);
      return null;
    }
  }

  async getTournament(tournamentId: string): Promise<Tournament | null> {
    try {
      const { data, error } = await this.supabase
        .from('tournaments')
        .select(`
          *,
          game:games(*),
          organizer:profiles(*),
          participants:tournament_participants(*),
          sponsors:tournament_sponsors(*)
        `)
        .eq('id', tournamentId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching tournament:', error);
      return null;
    }
  }

  async updateTournamentStatus(tournamentId: string, status: TournamentStatus): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('tournaments')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', tournamentId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating tournament status:', error);
      return false;
    }
  }

  // Registration Management
  async registerParticipant(tournamentId: string, participantId: string, participantType: 'user' | 'team'): Promise<boolean> {
    try {
      // Check if tournament is open for registration
      const tournament = await this.getTournament(tournamentId);
      if (!tournament || tournament.status !== 'registration_open') {
        throw new Error('Tournament registration is not open');
      }

      // Check if participant already registered
      const { data: existing } = await this.supabase
        .from('tournament_participants')
        .select('id')
        .eq('tournament_id', tournamentId)
        .eq('participant_id', participantId)
        .eq('participant_type', participantType)
        .single();

      if (existing) {
        throw new Error('Participant already registered');
      }

      // Check if tournament is full
      if (tournament.current_participants >= tournament.max_participants) {
        throw new Error('Tournament is full');
      }

      // Register participant
      const { error: insertError } = await this.supabase
        .from('tournament_participants')
        .insert({
          tournament_id: tournamentId,
          participant_id: participantId,
          participant_type: participantType,
          registration_date: new Date().toISOString(),
          checked_in: false,
          eliminated: false
        });

      if (insertError) throw insertError;

      // Update participant count
      const { error: updateError } = await this.supabase
        .from('tournaments')
        .update({
          current_participants: tournament.current_participants + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', tournamentId);

      if (updateError) throw updateError;

      return true;
    } catch (error) {
      console.error('Error registering participant:', error);
      return false;
    }
  }

  async checkInParticipant(tournamentId: string, participantId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('tournament_participants')
        .update({
          checked_in: true,
          check_in_time: new Date().toISOString()
        })
        .eq('tournament_id', tournamentId)
        .eq('participant_id', participantId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error checking in participant:', error);
      return false;
    }
  }

  // Bracket Generation
  async generateBracket(tournamentId: string): Promise<boolean> {
    try {
      const tournament = await this.getTournament(tournamentId);
      if (!tournament) throw new Error('Tournament not found');

      // Get checked-in participants
      const { data: participants, error: participantsError } = await this.supabase
        .from('tournament_participants')
        .select('*')
        .eq('tournament_id', tournamentId)
        .eq('checked_in', true)
        .order('registration_date');

      if (participantsError) throw participantsError;
      if (!participants || participants.length === 0) {
        throw new Error('No checked-in participants');
      }

      // Seed participants (random for now, could be based on rankings)
      const seededParticipants = this.seedParticipants(participants);
      
      // Generate bracket based on type
      let bracketData: any;
      switch (tournament.bracket_type) {
        case 'single_elimination':
          bracketData = this.generateSingleEliminationBracket(seededParticipants);
          break;
        case 'double_elimination':
          bracketData = this.generateDoubleEliminationBracket(seededParticipants);
          break;
        case 'round_robin':
          bracketData = this.generateRoundRobinBracket(seededParticipants);
          break;
        case 'swiss':
          bracketData = this.generateSwissBracket(seededParticipants);
          break;
        default:
          throw new Error('Unsupported bracket type');
      }

      // Save bracket
      const { error: bracketError } = await this.supabase
        .from('tournament_brackets')
        .upsert({
          tournament_id: tournamentId,
          bracket_data: bracketData,
          updated_at: new Date().toISOString()
        });

      if (bracketError) throw bracketError;

      // Create initial matches
      await this.createMatches(tournamentId, bracketData);

      // Update tournament status
      await this.updateTournamentStatus(tournamentId, 'in_progress');

      return true;
    } catch (error) {
      console.error('Error generating bracket:', error);
      return false;
    }
  }

  private seedParticipants(participants: TournamentParticipant[]): TournamentParticipant[] {
    // Simple random seeding for now - could be improved with ELO/ranking system
    return participants
      .map(participant => ({ ...participant, seed: Math.random() }))
      .sort((a, b) => (a.seed || 0) - (b.seed || 0))
      .map((participant, index) => ({ ...participant, seed: index + 1 }));
  }

  private generateSingleEliminationBracket(participants: TournamentParticipant[]): any {
    const rounds = Math.ceil(Math.log2(participants.length));
    const totalSlots = Math.pow(2, rounds);
    
    // Create bracket structure
    const bracket = {
      type: 'single_elimination',
      rounds: rounds,
      participants_count: participants.length,
      matches: [] as any[]
    };

    // Generate first round matches
    for (let i = 0; i < totalSlots; i += 2) {
      const participant1 = participants[i] || null;
      const participant2 = participants[i + 1] || null;
      
      bracket.matches.push({
        round: 1,
        position: Math.floor(i / 2) + 1,
        participant1_id: participant1?.participant_id || null,
        participant2_id: participant2?.participant_id || null,
        status: (participant1 && participant2) ? 'pending' : 'bye'
      });
    }

    // Generate subsequent rounds
    let currentMatches = bracket.matches.filter(m => m.round === 1).length;
    for (let round = 2; round <= rounds; round++) {
      const matchesInRound = Math.floor(currentMatches / 2);
      for (let i = 0; i < matchesInRound; i++) {
        bracket.matches.push({
          round,
          position: i + 1,
          participant1_id: null,
          participant2_id: null,
          status: 'pending'
        });
      }
      currentMatches = matchesInRound;
    }

    return bracket;
  }

  private generateDoubleEliminationBracket(participants: TournamentParticipant[]): any {
    // Double elimination implementation
    const upperBracket = this.generateSingleEliminationBracket(participants);
    
    return {
      type: 'double_elimination',
      upper_bracket: upperBracket,
      lower_bracket: {
        rounds: upperBracket.rounds - 1,
        matches: []
      },
      grand_final: {
        match1: { participant1_id: null, participant2_id: null },
        match2: { participant1_id: null, participant2_id: null } // Reset match if needed
      }
    };
  }

  private generateRoundRobinBracket(participants: TournamentParticipant[]): any {
    const matches = [];
    
    // Generate all possible matches
    for (let i = 0; i < participants.length; i++) {
      for (let j = i + 1; j < participants.length; j++) {
        matches.push({
          round: 1, // All matches are in one "round" for round robin
          position: matches.length + 1,
          participant1_id: participants[i].participant_id,
          participant2_id: participants[j].participant_id,
          status: 'pending'
        });
      }
    }

    return {
      type: 'round_robin',
      participants_count: participants.length,
      total_matches: matches.length,
      matches
    };
  }

  private generateSwissBracket(participants: TournamentParticipant[]): any {
    // Swiss system - participants with similar records play each other
    const rounds = Math.ceil(Math.log2(participants.length));
    
    return {
      type: 'swiss',
      rounds: rounds,
      participants_count: participants.length,
      current_round: 1,
      matches: [],
      standings: participants.map(p => ({
        participant_id: p.participant_id,
        wins: 0,
        losses: 0,
        draws: 0,
        opponents_played: []
      }))
    };
  }

  private async createMatches(tournamentId: string, bracketData: any): Promise<void> {
    const matches = bracketData.matches || [];
    
    for (const match of matches) {
      if (match.participant1_id && match.participant2_id) {
        await this.supabase
          .from('tournament_matches')
          .insert({
            tournament_id: tournamentId,
            bracket_position: `${match.round}-${match.position}`,
            round: match.round,
            participant1_id: match.participant1_id,
            participant2_id: match.participant2_id,
            status: 'pending',
            score: '0-0'
          });
      }
    }
  }

  // Match Management
  async updateMatchResult(matchId: string, winnerId: string, score: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('tournament_matches')
        .update({
          winner_id: winnerId,
          score,
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', matchId);

      if (error) throw error;

      // Update bracket progression
      await this.progressBracket(matchId, winnerId);
      
      return true;
    } catch (error) {
      console.error('Error updating match result:', error);
      return false;
    }
  }

  private async progressBracket(matchId: string, winnerId: string): Promise<void> {
    // Get match details
    const { data: match } = await this.supabase
      .from('tournament_matches')
      .select('*')
      .eq('id', matchId)
      .single();

    if (!match) return;

    // Get tournament bracket
    const { data: bracket } = await this.supabase
      .from('tournament_brackets')
      .select('*')
      .eq('tournament_id', match.tournament_id)
      .single();

    if (!bracket) return;

    // Logic to advance winner to next round would go here
    // This is simplified - full implementation would handle bracket progression
  }

  // Prize Pool Management
  async updatePrizePool(tournamentId: string, amount: number, source: 'entry_fees' | 'sponsors' | 'organizer'): Promise<boolean> {
    try {
      const tournament = await this.getTournament(tournamentId);
      if (!tournament) return false;

      let updateData: any = { updated_at: new Date().toISOString() };

      if (source === 'sponsors') {
        updateData.sponsor_prize_pool = (tournament.sponsor_prize_pool || 0) + amount;
        updateData.prize_pool = tournament.prize_pool + amount;
      } else {
        updateData.prize_pool = tournament.prize_pool + amount;
      }

      const { error } = await this.supabase
        .from('tournaments')
        .update(updateData)
        .eq('id', tournamentId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating prize pool:', error);
      return false;
    }
  }

  async distributePrizes(tournamentId: string, distribution: PrizeDistribution[]): Promise<boolean> {
    try {
      // Get final standings
      const { data: participants } = await this.supabase
        .from('tournament_participants')
        .select('*')
        .eq('tournament_id', tournamentId)
        .not('placement', 'is', null)
        .order('placement');

      if (!participants) return false;

      const tournament = await this.getTournament(tournamentId);
      if (!tournament) return false;

      // Calculate and record prize distributions
      for (const participant of participants) {
        const prizeInfo = distribution.find(d => d.placement === participant.placement);
        if (prizeInfo && tournament.prize_pool > 0) {
          const prizeAmount = (tournament.prize_pool * prizeInfo.percentage) / 100;
          
          // Record prize in database (would need prizes table)
          await this.supabase
            .from('tournament_prizes')
            .insert({
              tournament_id: tournamentId,
              participant_id: participant.participant_id,
              participant_type: participant.participant_type,
              placement: participant.placement,
              amount: prizeAmount,
              awarded_at: new Date().toISOString()
            });
        }
      }

      return true;
    } catch (error) {
      console.error('Error distributing prizes:', error);
      return false;
    }
  }

  // Sponsor Management
  async addSponsor(tournamentId: string, sponsorData: Omit<TournamentSponsor, 'id' | 'tournament_id' | 'created_at'>): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('tournament_sponsors')
        .insert({
          tournament_id: tournamentId,
          ...sponsorData,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      // Add sponsor contribution to prize pool
      await this.updatePrizePool(tournamentId, sponsorData.contribution_amount, 'sponsors');

      return true;
    } catch (error) {
      console.error('Error adding sponsor:', error);
      return false;
    }
  }

  // Tournament Discovery
  async searchTournaments(filters: {
    game_id?: string;
    status?: TournamentStatus;
    format?: TournamentFormat;
    min_prize?: number;
    max_entry_fee?: number;
  }): Promise<Tournament[]> {
    try {
      let query = this.supabase
        .from('tournaments')
        .select(`
          *,
          game:games(*),
          organizer:profiles(*)
        `);

      if (filters.game_id) {
        query = query.eq('game_id', filters.game_id);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.format) {
        query = query.eq('format', filters.format);
      }
      if (filters.min_prize) {
        query = query.gte('prize_pool', filters.min_prize);
      }
      if (filters.max_entry_fee) {
        query = query.lte('entry_fee', filters.max_entry_fee);
      }

      const { data, error } = await query
        .order('tournament_start', { ascending: true })
        .limit(50);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching tournaments:', error);
      return [];
    }
  }
}

export const tournamentManager = new TournamentManager();
