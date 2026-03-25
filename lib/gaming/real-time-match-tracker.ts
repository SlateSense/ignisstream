import { createClient } from '@/lib/supabase/client';

export interface LiveMatch {
  id: string;
  game_id: string;
  platform: string;
  player_id: string;
  match_start: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  current_score?: string;
  current_round?: number;
  total_rounds?: number;
  map?: string;
  game_mode: string;
  real_time_stats: RealTimeStats;
  team_composition?: TeamMember[];
  enemy_composition?: TeamMember[];
}

export interface RealTimeStats {
  kills: number;
  deaths: number;
  assists: number;
  damage_dealt: number;
  damage_taken: number;
  headshots: number;
  accuracy: number;
  current_streak: number;
  best_streak: number;
  economy?: number; // For games with economy systems
  utility_damage?: number;
  first_bloods: number;
  clutches: number;
  plants?: number; // Spike plants in Valorant
  defuses?: number; // Spike defuses in Valorant
}

export interface TeamMember {
  player_id: string;
  username: string;
  agent?: string; // Character/Agent selection
  rank?: string;
  stats: RealTimeStats;
}

export interface MatchEvent {
  id: string;
  match_id: string;
  timestamp: string;
  event_type: 'kill' | 'death' | 'assist' | 'round_start' | 'round_end' | 'bomb_plant' | 'bomb_defuse' | 'clutch' | 'ace' | 'multikill';
  player_id: string;
  victim_id?: string;
  weapon?: string;
  headshot?: boolean;
  location?: { x: number; y: number };
  round_number?: number;
  additional_data?: any;
}

export interface GameSession {
  session_id: string;
  user_id: string;
  game_id: string;
  platform: string;
  start_time: string;
  end_time?: string;
  session_duration: number;
  matches_played: number;
  performance_summary: {
    avg_kd_ratio: number;
    avg_adr: number;
    win_rate: number;
    best_match: string;
    improvement_metrics: any;
  };
}

export class RealTimeMatchTracker {
  private supabase = createClient();
  private activeMatches: Map<string, LiveMatch> = new Map();
  private eventListeners: Map<string, ((match: LiveMatch) => void)[]> = new Map();
  private matchEventListeners: Map<string, ((event: MatchEvent) => void)[]> = new Map();
  
  constructor() {
    this.initializeRealtimeSubscriptions();
  }

  private initializeRealtimeSubscriptions() {
    // Subscribe to live match updates
    this.supabase
      .channel('live_matches')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'live_matches' },
        (payload) => this.handleMatchUpdate(payload)
      )
      .subscribe();

    // Subscribe to match events
    this.supabase
      .channel('match_events')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'match_events' },
        (payload) => this.handleMatchEvent(payload.new as MatchEvent)
      )
      .subscribe();
  }

  // Match Management
  async startMatch(userId: string, gameId: string, platform: string, gameMode: string): Promise<LiveMatch | null> {
    try {
      const match: LiveMatch = {
        id: crypto.randomUUID(),
        game_id: gameId,
        platform: platform,
        player_id: userId,
        match_start: new Date().toISOString(),
        status: 'in_progress',
        game_mode: gameMode,
        real_time_stats: {
          kills: 0,
          deaths: 0,
          assists: 0,
          damage_dealt: 0,
          damage_taken: 0,
          headshots: 0,
          accuracy: 0,
          current_streak: 0,
          best_streak: 0,
          first_bloods: 0,
          clutches: 0
        }
      };

      const { data, error } = await this.supabase
        .from('live_matches')
        .insert(match)
        .select()
        .single();

      if (error) throw error;

      this.activeMatches.set(match.id, match);
      return match;
    } catch (error) {
      console.error('Error starting match tracking:', error);
      return null;
    }
  }

  async endMatch(matchId: string, finalStats?: Partial<RealTimeStats>): Promise<boolean> {
    try {
      const match = this.activeMatches.get(matchId);
      if (!match) return false;

      const updatedMatch = {
        ...match,
        status: 'completed' as const,
        real_time_stats: { ...match.real_time_stats, ...finalStats }
      };

      const { error } = await this.supabase
        .from('live_matches')
        .update({
          status: 'completed',
          real_time_stats: updatedMatch.real_time_stats
        })
        .eq('id', matchId);

      if (error) throw error;

      // Convert live match to match history
      await this.archiveMatch(updatedMatch);
      
      this.activeMatches.delete(matchId);
      return true;
    } catch (error) {
      console.error('Error ending match:', error);
      return false;
    }
  }

  // Real-time stat updates
  async updateMatchStats(matchId: string, statUpdates: Partial<RealTimeStats>): Promise<void> {
    try {
      const match = this.activeMatches.get(matchId);
      if (!match) return;

      const updatedStats = { ...match.real_time_stats, ...statUpdates };
      
      // Update streak tracking
      if (statUpdates.kills && statUpdates.kills > match.real_time_stats.kills) {
        updatedStats.current_streak = (updatedStats.current_streak || 0) + 1;
        updatedStats.best_streak = Math.max(updatedStats.best_streak, updatedStats.current_streak);
      }

      if (statUpdates.deaths && statUpdates.deaths > match.real_time_stats.deaths) {
        updatedStats.current_streak = 0;
      }

      match.real_time_stats = updatedStats;
      this.activeMatches.set(matchId, match);

      // Update database
      await this.supabase
        .from('live_matches')
        .update({ real_time_stats: updatedStats })
        .eq('id', matchId);

      // Notify listeners
      this.notifyMatchUpdate(matchId, match);
    } catch (error) {
      console.error('Error updating match stats:', error);
    }
  }

  async recordMatchEvent(matchId: string, event: Omit<MatchEvent, 'id' | 'match_id' | 'timestamp'>): Promise<void> {
    try {
      const matchEvent: MatchEvent = {
        id: crypto.randomUUID(),
        match_id: matchId,
        timestamp: new Date().toISOString(),
        ...event
      };

      const { error } = await this.supabase
        .from('match_events')
        .insert(matchEvent);

      if (error) throw error;

      // Update match stats based on event
      await this.processMatchEvent(matchEvent);
    } catch (error) {
      console.error('Error recording match event:', error);
    }
  }

  private async processMatchEvent(event: MatchEvent): Promise<void> {
    const match = this.activeMatches.get(event.match_id);
    if (!match) return;

    const statUpdates: Partial<RealTimeStats> = {};

    switch (event.event_type) {
      case 'kill':
        statUpdates.kills = (match.real_time_stats.kills || 0) + 1;
        if (event.headshot) {
          statUpdates.headshots = (match.real_time_stats.headshots || 0) + 1;
        }
        if (event.additional_data?.first_blood) {
          statUpdates.first_bloods = (match.real_time_stats.first_bloods || 0) + 1;
        }
        break;

      case 'death':
        statUpdates.deaths = (match.real_time_stats.deaths || 0) + 1;
        break;

      case 'assist':
        statUpdates.assists = (match.real_time_stats.assists || 0) + 1;
        break;

      case 'clutch':
        statUpdates.clutches = (match.real_time_stats.clutches || 0) + 1;
        break;
    }

    if (Object.keys(statUpdates).length > 0) {
      await this.updateMatchStats(event.match_id, statUpdates);
    }
  }

  // Game-specific integrations
  async integrateValorantMatch(puuid: string, matchId: string): Promise<void> {
    try {
      // This would integrate with Riot API for real-time Valorant data
      // Poll match status and update local tracking
      
      const pollInterval = setInterval(async () => {
        const matchData = await this.fetchValorantMatchData(matchId);
        if (matchData && matchData.status === 'completed') {
          clearInterval(pollInterval);
          await this.endMatch(matchId, matchData.finalStats);
        } else if (matchData) {
          await this.updateMatchStats(matchId, matchData.currentStats);
        }
      }, 10000); // Poll every 10 seconds

    } catch (error) {
      console.error('Error integrating Valorant match:', error);
    }
  }

  private async fetchValorantMatchData(matchId: string): Promise<any> {
    // Mock implementation - would use Riot API
    return {
      status: 'in_progress',
      currentStats: {
        kills: Math.floor(Math.random() * 25),
        deaths: Math.floor(Math.random() * 20),
        assists: Math.floor(Math.random() * 15)
      }
    };
  }

  // Analytics and Session Tracking
  async startGameSession(userId: string, gameId: string, platform: string): Promise<GameSession> {
    const session: GameSession = {
      session_id: crypto.randomUUID(),
      user_id: userId,
      game_id: gameId,
      platform: platform,
      start_time: new Date().toISOString(),
      session_duration: 0,
      matches_played: 0,
      performance_summary: {
        avg_kd_ratio: 0,
        avg_adr: 0,
        win_rate: 0,
        best_match: '',
        improvement_metrics: {}
      }
    };

    await this.supabase
      .from('game_sessions')
      .insert(session);

    return session;
  }

  async endGameSession(sessionId: string): Promise<void> {
    try {
      const { data: session } = await this.supabase
        .from('game_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (!session) return;

      // Calculate session performance
      const sessionMatches = await this.supabase
        .from('match_history')
        .select('*')
        .eq('user_id', session.user_id)
        .gte('date_played', session.start_time);

      const performanceSummary = this.calculateSessionPerformance(sessionMatches.data || []);

      await this.supabase
        .from('game_sessions')
        .update({
          end_time: new Date().toISOString(),
          session_duration: new Date().getTime() - new Date(session.start_time).getTime(),
          matches_played: sessionMatches.data?.length || 0,
          performance_summary: performanceSummary
        })
        .eq('session_id', sessionId);

    } catch (error) {
      console.error('Error ending game session:', error);
    }
  }

  private calculateSessionPerformance(matches: any[]): any {
    if (matches.length === 0) {
      return {
        avg_kd_ratio: 0,
        avg_adr: 0,
        win_rate: 0,
        best_match: '',
        improvement_metrics: {}
      };
    }

    const totalKills = matches.reduce((sum, match) => sum + (match.kills || 0), 0);
    const totalDeaths = matches.reduce((sum, match) => sum + (match.deaths || 0), 0);
    const wins = matches.filter(match => match.result === 'win').length;
    
    return {
      avg_kd_ratio: totalDeaths > 0 ? totalKills / totalDeaths : totalKills,
      avg_adr: matches.reduce((sum, match) => sum + (match.damage_dealt || 0), 0) / matches.length,
      win_rate: (wins / matches.length) * 100,
      best_match: matches.reduce((best, current) => 
        (current.kills || 0) > (best.kills || 0) ? current : best
      ).match_id,
      improvement_metrics: {
        kills_per_match: totalKills / matches.length,
        deaths_per_match: totalDeaths / matches.length
      }
    };
  }

  // Event handling
  onMatchUpdate(matchId: string, callback: (match: LiveMatch) => void): void {
    if (!this.eventListeners.has(matchId)) {
      this.eventListeners.set(matchId, []);
    }
    this.eventListeners.get(matchId)!.push(callback);
  }

  onMatchEvent(matchId: string, callback: (event: MatchEvent) => void): void {
    if (!this.matchEventListeners.has(matchId)) {
      this.matchEventListeners.set(matchId, []);
    }
    this.matchEventListeners.get(matchId)!.push(callback);
  }

  private notifyMatchUpdate(matchId: string, match: LiveMatch): void {
    const listeners = this.eventListeners.get(matchId);
    if (listeners) {
      listeners.forEach(callback => callback(match));
    }
  }

  private handleMatchUpdate(payload: any): void {
    const match = payload.new as LiveMatch;
    this.activeMatches.set(match.id, match);
    this.notifyMatchUpdate(match.id, match);
  }

  private handleMatchEvent(event: MatchEvent): void {
    const listeners = this.matchEventListeners.get(event.match_id);
    if (listeners) {
      listeners.forEach(callback => callback(event));
    }
  }

  // Archive completed match to match history
  private async archiveMatch(match: LiveMatch): Promise<void> {
    try {
      const matchHistory = {
        match_id: match.id,
        user_id: match.player_id,
        game_id: match.game_id,
        platform: match.platform,
        date_played: match.match_start,
        duration: new Date().getTime() - new Date(match.match_start).getTime(),
        result: 'completed' as const,
        kills: match.real_time_stats.kills,
        deaths: match.real_time_stats.deaths,
        assists: match.real_time_stats.assists,
        damage_dealt: match.real_time_stats.damage_dealt,
        game_mode: match.game_mode,
        map: match.map,
        score: `${match.real_time_stats.kills}/${match.real_time_stats.deaths}/${match.real_time_stats.assists}`
      };

      await this.supabase
        .from('match_history')
        .insert(matchHistory);

    } catch (error) {
      console.error('Error archiving match:', error);
    }
  }

  // Getters
  getActiveMatch(matchId: string): LiveMatch | undefined {
    return this.activeMatches.get(matchId);
  }

  getActiveMatches(userId?: string): LiveMatch[] {
    const matches = Array.from(this.activeMatches.values());
    return userId ? matches.filter(match => match.player_id === userId) : matches;
  }

  async getMatchHistory(userId: string, gameId?: string, limit: number = 50): Promise<any[]> {
    try {
      let query = this.supabase
        .from('match_history')
        .select('*')
        .eq('user_id', userId);

      if (gameId) {
        query = query.eq('game_id', gameId);
      }

      const { data, error } = await query
        .order('date_played', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching match history:', error);
      return [];
    }
  }
}

export const realTimeMatchTracker = new RealTimeMatchTracker();
