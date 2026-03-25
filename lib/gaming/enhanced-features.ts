import { createClient } from '@/lib/supabase/client';
import { 
  SkillPrediction, 
  PlayPattern, 
  Tournament, 
  TournamentParticipant, 
  TournamentMatch, 
  FriendComparison, 
  LiveMatchUpdate, 
  WebSocketMessage,
  GameStats 
} from './game-api-manager';

export class EnhancedGamingFeatures {
  private supabase = createClient();
  private websocketConnections: Map<string, WebSocket> = new Map();
  private mlApiEndpoint: string;

  constructor() {
    this.mlApiEndpoint = process.env.NEXT_PUBLIC_ML_API_ENDPOINT || '';
  }

  // Real-time Updates via WebSocket
  async initializeWebSocket(userId: string): Promise<void> {
    try {
      const wsUrl = `ws://localhost:3001/ws/${userId}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected for user:', userId);
        this.websocketConnections.set(userId, ws);
      };

      ws.onmessage = (event) => {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleWebSocketMessage(message, userId);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected for user:', userId);
        this.websocketConnections.delete(userId);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Error initializing WebSocket:', error);
    }
  }

  private handleWebSocketMessage(message: WebSocketMessage, userId: string): void {
    switch (message.type) {
      case 'match_update':
        this.handleMatchUpdate(message.payload as LiveMatchUpdate, userId);
        break;
      case 'friend_online':
        this.handleFriendOnline(message.payload, userId);
        break;
      case 'achievement_unlocked':
        this.handleAchievementUnlocked(message.payload, userId);
        break;
      case 'tournament_update':
        this.handleTournamentUpdate(message.payload, userId);
        break;
    }
  }

  private async handleMatchUpdate(update: LiveMatchUpdate, userId: string): Promise<void> {
    try {
      // Store live match update
      await this.supabase
        .from('live_match_updates')
        .insert({
          match_id: update.matchId,
          game_id: update.gameId,
          user_id: userId,
          type: update.type,
          data: update.data,
          timestamp: update.timestamp
        });

      // Broadcast to relevant users (teammates, friends watching)
      this.broadcastToRelevantUsers(update, userId);
    } catch (error) {
      console.error('Error handling match update:', error);
    }
  }

  private handleFriendOnline(friendData: any, userId: string): void {
    // Handle friend coming online
    console.log(`Friend ${friendData.username} is now online`);
  }

  private handleAchievementUnlocked(achievementData: any, userId: string): void {
    // Handle achievement unlock
    console.log(`Achievement unlocked: ${achievementData.name}`);
  }

  private handleTournamentUpdate(tournamentData: any, userId: string): void {
    // Handle tournament updates
    console.log(`Tournament update: ${tournamentData.message}`);
  }

  private broadcastToRelevantUsers(update: LiveMatchUpdate, sourceUserId: string): void {
    // Implementation for broadcasting updates to friends/teammates
    this.websocketConnections.forEach((ws, userId) => {
      if (userId !== sourceUserId && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'match_update',
          payload: update,
          timestamp: new Date().toISOString()
        }));
      }
    });
  }

  // ML-based Skill Analysis and Predictions
  async generateSkillPrediction(userId: string, gameId: string): Promise<SkillPrediction | null> {
    try {
      // Get user's historical data
      const { data: gameStats } = await this.supabase
        .from('user_game_stats')
        .select('*')
        .eq('user_id', userId)
        .eq('game_id', gameId)
        .single();

      const { data: matchHistory } = await this.supabase
        .from('match_history')
        .select('*')
        .eq('user_id', userId)
        .eq('game_id', gameId)
        .order('date_played', { ascending: false })
        .limit(50);

      if (!gameStats || !matchHistory) return null;

      // Prepare data for ML model
      const mlInput = this.prepareMlInput(gameStats, matchHistory);

      // Call ML API for prediction
      const response = await fetch(`${this.mlApiEndpoint}/predict-skill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mlInput),
      });

      if (!response.ok) return null;

      const prediction = await response.json();

      // Enhance prediction with additional insights
      const skillPrediction: SkillPrediction = {
        userId,
        gameId,
        predictedRank: prediction.predicted_rank,
        confidence: prediction.confidence,
        improvementAreas: this.identifyImprovementAreas(gameStats, matchHistory),
        timeToNextRank: prediction.time_to_next_rank,
        skillTrends: {
          aim: this.calculateAimTrend(matchHistory),
          strategy: this.calculateStrategyTrend(matchHistory),
          teamwork: this.calculateTeamworkTrend(matchHistory),
          positioning: this.calculatePositioningTrend(matchHistory)
        }
      };

      // Store prediction in database
      await this.supabase
        .from('skill_predictions')
        .upsert({
          user_id: userId,
          game_id: gameId,
          prediction_data: skillPrediction,
          generated_at: new Date().toISOString()
        });

      return skillPrediction;
    } catch (error) {
      console.error('Error generating skill prediction:', error);
      return null;
    }
  }

  private prepareMlInput(gameStats: any, matchHistory: any[]): any {
    return {
      total_playtime: gameStats.total_playtime,
      matches_played: gameStats.matches_played,
      win_rate: gameStats.win_rate,
      kd_ratio: gameStats.kd_ratio,
      recent_performance: matchHistory.slice(0, 10).map(match => ({
        result: match.result,
        kills: match.kills,
        deaths: match.deaths,
        assists: match.assists,
        duration: match.duration
      })),
      performance_trend: this.calculatePerformanceTrend(matchHistory)
    };
  }

  private identifyImprovementAreas(gameStats: any, matchHistory: any[]): string[] {
    const areas: string[] = [];
    
    if (gameStats.kd_ratio < 1.0) areas.push('aim_accuracy');
    if (gameStats.win_rate < 50) areas.push('game_sense');
    if (this.calculateTeamworkScore(matchHistory) < 0.6) areas.push('teamwork');
    if (this.calculateConsistency(matchHistory) < 0.7) areas.push('consistency');

    return areas;
  }

  private calculateAimTrend(matchHistory: any[]): number {
    if (!matchHistory.length) return 0;
    
    const kdRatios = matchHistory.map(match => 
      match.deaths > 0 ? match.kills / match.deaths : match.kills
    );
    
    return this.calculateTrendSlope(kdRatios);
  }

  private calculateStrategyTrend(matchHistory: any[]): number {
    // Calculate based on objective plays, map control, etc.
    const objectiveScores = matchHistory.map(match => match.objective_score || 0);
    return this.calculateTrendSlope(objectiveScores);
  }

  private calculateTeamworkTrend(matchHistory: any[]): number {
    const assistRatios = matchHistory.map(match => 
      match.kills > 0 ? (match.assists || 0) / match.kills : 0
    );
    return this.calculateTrendSlope(assistRatios);
  }

  private calculatePositioningTrend(matchHistory: any[]): number {
    // Calculate based on survival time, damage taken, etc.
    const survivalRatios = matchHistory.map(match => 
      match.duration > 0 ? (match.survival_time || match.duration) / match.duration : 0
    );
    return this.calculateTrendSlope(survivalRatios);
  }

  private calculateTrendSlope(values: number[]): number {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const xSum = n * (n + 1) / 2;
    const ySum = values.reduce((sum, val) => sum + val, 0);
    const xySum = values.reduce((sum, val, index) => sum + val * (index + 1), 0);
    const x2Sum = n * (n + 1) * (2 * n + 1) / 6;
    
    const slope = (n * xySum - xSum * ySum) / (n * x2Sum - xSum * xSum);
    return Math.max(-1, Math.min(1, slope)); // Normalize between -1 and 1
  }

  private calculatePerformanceTrend(matchHistory: any[]): number {
    const recentMatches = matchHistory.slice(0, 10);
    const wins = recentMatches.filter(match => match.result === 'win').length;
    return wins / recentMatches.length;
  }

  private calculateTeamworkScore(matchHistory: any[]): number {
    if (!matchHistory.length) return 0;
    
    const avgAssists = matchHistory.reduce((sum, match) => sum + (match.assists || 0), 0) / matchHistory.length;
    const avgKills = matchHistory.reduce((sum, match) => sum + (match.kills || 0), 0) / matchHistory.length;
    
    return avgKills > 0 ? Math.min(1, avgAssists / avgKills) : 0;
  }

  private calculateConsistency(matchHistory: any[]): number {
    if (!matchHistory.length) return 0;
    
    const kdRatios = matchHistory.map(match => 
      match.deaths > 0 ? match.kills / match.deaths : match.kills
    );
    
    const mean = kdRatios.reduce((sum, val) => sum + val, 0) / kdRatios.length;
    const variance = kdRatios.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / kdRatios.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Lower standard deviation = higher consistency
    return Math.max(0, 1 - (standardDeviation / mean));
  }

  async analyzePlayPatterns(userId: string): Promise<PlayPattern | null> {
    try {
      const { data: sessions } = await this.supabase
        .from('game_sessions')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
        .order('created_at', { ascending: false });

      if (!sessions?.length) return null;

      // Analyze peak hours
      const hourCounts = new Array(24).fill(0);
      sessions.forEach(session => {
        const hour = new Date(session.created_at).getHours();
        hourCounts[hour]++;
      });
      const peakHours = hourCounts
        .map((count, hour) => ({ hour, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)
        .map(item => item.hour);

      // Analyze session durations
      const durations = sessions.map(s => s.duration || 0);
      const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      const maxDuration = Math.max(...durations);
      const minDuration = Math.min(...durations);

      // Analyze game preferences
      const gameGenres: Record<string, number> = {};
      const platforms: Record<string, number> = {};
      
      sessions.forEach(session => {
        if (session.game_genre) {
          gameGenres[session.game_genre] = (gameGenres[session.game_genre] || 0) + 1;
        }
        if (session.platform) {
          platforms[session.platform] = (platforms[session.platform] || 0) + 1;
        }
      });

      // Determine difficulty preference
      const competitiveMatches = sessions.filter(s => s.game_mode?.includes('competitive')).length;
      const casualMatches = sessions.filter(s => s.game_mode?.includes('casual')).length;
      const hardcoreMatches = sessions.filter(s => s.game_mode?.includes('hardcore')).length;
      
      let difficulty: 'casual' | 'competitive' | 'hardcore' = 'casual';
      if (competitiveMatches > casualMatches && competitiveMatches > hardcoreMatches) {
        difficulty = 'competitive';
      } else if (hardcoreMatches > casualMatches && hardcoreMatches > competitiveMatches) {
        difficulty = 'hardcore';
      }

      const playPattern: PlayPattern = {
        peakHours,
        preferredGameModes: this.getTopGameModes(sessions),
        sessionDuration: {
          average: avgDuration,
          longest: maxDuration,
          shortest: minDuration
        },
        skillProgression: await this.calculateSkillProgression(userId),
        gamePreferences: {
          genres: gameGenres,
          platforms,
          difficulty
        }
      };

      // Store play pattern analysis
      await this.supabase
        .from('play_patterns')
        .upsert({
          user_id: userId,
          pattern_data: playPattern,
          analyzed_at: new Date().toISOString()
        });

      return playPattern;
    } catch (error) {
      console.error('Error analyzing play patterns:', error);
      return null;
    }
  }

  private getTopGameModes(sessions: any[]): string[] {
    const modeCounts: Record<string, number> = {};
    sessions.forEach(session => {
      if (session.game_mode) {
        modeCounts[session.game_mode] = (modeCounts[session.game_mode] || 0) + 1;
      }
    });

    return Object.entries(modeCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([mode]) => mode);
  }

  private async calculateSkillProgression(userId: string): Promise<{ trend: 'improving' | 'declining' | 'stable'; rate: number; lastUpdated: string }> {
    const { data: recentStats } = await this.supabase
      .from('user_game_stats_history')
      .select('*')
      .eq('user_id', userId)
      .order('recorded_at', { ascending: false })
      .limit(10);

    if (!recentStats?.length) {
      return { trend: 'stable', rate: 0, lastUpdated: new Date().toISOString() };
    }

    const winRates = recentStats.map(stat => stat.win_rate || 0);
    const trend = this.calculateTrendSlope(winRates);

    let trendType: 'improving' | 'declining' | 'stable' = 'stable';
    if (trend > 0.1) trendType = 'improving';
    else if (trend < -0.1) trendType = 'declining';

    return {
      trend: trendType,
      rate: Math.abs(trend),
      lastUpdated: recentStats[0].recorded_at
    };
  }

  // Tournament System
  async createTournament(creatorId: string, tournamentData: Omit<Tournament, 'id' | 'participants' | 'matches'>): Promise<string | null> {
    try {
      const { data: tournament, error } = await this.supabase
        .from('tournaments')
        .insert({
          ...tournamentData,
          created_by: creatorId,
          status: 'upcoming'
        })
        .select('id')
        .single();

      if (error) throw error;

      return tournament.id;
    } catch (error) {
      console.error('Error creating tournament:', error);
      return null;
    }
  }

  async joinTournament(userId: string, tournamentId: string): Promise<boolean> {
    try {
      // Get user's skill rating for the game
      const { data: userStats } = await this.supabase
        .from('user_game_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      const skillRating = this.calculateOverallSkillRating(userStats);

      const { error } = await this.supabase
        .from('tournament_participants')
        .insert({
          tournament_id: tournamentId,
          user_id: userId,
          skill_rating: skillRating,
          status: 'registered',
          registered_at: new Date().toISOString()
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error joining tournament:', error);
      return false;
    }
  }

  private calculateOverallSkillRating(userStats: any): number {
    if (!userStats) return 1000; // Default rating

    const factors = {
      winRate: (userStats.win_rate || 0) / 100,
      kdRatio: Math.min((userStats.kd_ratio || 0) / 2, 1), // Cap at 2.0 KD
      experience: Math.min((userStats.matches_played || 0) / 1000, 1) // Cap at 1000 matches
    };

    return Math.round(1000 + (factors.winRate * 500) + (factors.kdRatio * 300) + (factors.experience * 200));
  }

  async generateTournamentBracket(tournamentId: string): Promise<boolean> {
    try {
      const { data: participants } = await this.supabase
        .from('tournament_participants')
        .select('*')
        .eq('tournament_id', tournamentId)
        .eq('status', 'registered');

      if (!participants?.length) return false;

      // Sort by skill rating for balanced matchups
      participants.sort((a, b) => b.skill_rating - a.skill_rating);

      const matches: Omit<TournamentMatch, 'id'>[] = [];
      
      // Create first round matches
      for (let i = 0; i < participants.length; i += 2) {
        if (participants[i + 1]) {
          matches.push({
            tournamentId: tournamentId,
            round: 1,
            participant1Id: participants[i].user_id,
            participant2Id: participants[i + 1].user_id,
            scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
            status: 'scheduled'
          });
        }
      }

      const { error } = await this.supabase
        .from('tournament_matches')
        .insert(matches);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error generating tournament bracket:', error);
      return false;
    }
  }

  // Social Features - Friend Comparisons
  async generateFriendComparison(userId: string, friendId: string): Promise<FriendComparison | null> {
    try {
      // Get friend's profile
      const { data: friendProfile } = await this.supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', friendId)
        .single();

      if (!friendProfile) return null;

      // Get common games
      const { data: myGames } = await this.supabase
        .from('user_game_stats')
        .select('*, game:games(id, name)')
        .eq('user_id', userId);

      const { data: friendGames } = await this.supabase
        .from('user_game_stats')
        .select('*, game:games(id, name)')
        .eq('user_id', friendId);

      if (!myGames || !friendGames) return null;

      // Find common games
      const commonGames = myGames.filter(myGame => 
        friendGames.some(friendGame => friendGame.game_id === myGame.game_id)
      );

      const gameComparisons = commonGames.map(myGame => {
        const friendGame = friendGames.find(fg => fg.game_id === myGame.game_id)!;
        
        const skillDiff = (myGame.win_rate || 0) - (friendGame.win_rate || 0);
        const playtimeDiff = (myGame.total_playtime || 0) - (friendGame.total_playtime || 0);
        const winRateDiff = skillDiff;

        return {
          gameId: myGame.game_id,
          gameName: myGame.game.name,
          myStats: myGame as GameStats,
          friendStats: friendGame as GameStats,
          comparison: {
            skillDifference: skillDiff,
            playtimeDifference: playtimeDiff,
            winRateDifference: winRateDiff,
            strongerAreas: this.identifyStrongerAreas(myGame, friendGame),
            improvementSuggestions: this.generateImprovementSuggestions(myGame, friendGame)
          }
        };
      });

      // Calculate overall comparison
      const myAvgSkill = myGames.reduce((sum, game) => sum + (game.win_rate || 0), 0) / myGames.length;
      const friendAvgSkill = friendGames.reduce((sum, game) => sum + (game.win_rate || 0), 0) / friendGames.length;
      
      let recommendation: 'invite_to_team' | 'practice_together' | 'learn_from_friend' | 'mentor_friend' = 'practice_together';
      
      if (myAvgSkill > friendAvgSkill + 10) recommendation = 'mentor_friend';
      else if (friendAvgSkill > myAvgSkill + 10) recommendation = 'learn_from_friend';
      else if (Math.abs(myAvgSkill - friendAvgSkill) < 5) recommendation = 'invite_to_team';

      const comparison: FriendComparison = {
        friend: {
          userId: friendId,
          username: friendProfile.username,
          avatarUrl: friendProfile.avatar_url
        },
        games: gameComparisons,
        overallComparison: {
          totalGamesInCommon: commonGames.length,
          myAverageSkill: myAvgSkill,
          friendAverageSkill: friendAvgSkill,
          recommendation
        }
      };

      return comparison;
    } catch (error) {
      console.error('Error generating friend comparison:', error);
      return null;
    }
  }

  private identifyStrongerAreas(myStats: any, friendStats: any): string[] {
    const areas: string[] = [];
    
    if ((myStats.win_rate || 0) > (friendStats.win_rate || 0)) areas.push('win_rate');
    if ((myStats.kd_ratio || 0) > (friendStats.kd_ratio || 0)) areas.push('kd_ratio');
    if ((myStats.total_playtime || 0) > (friendStats.total_playtime || 0)) areas.push('experience');
    if ((myStats.matches_played || 0) > (friendStats.matches_played || 0)) areas.push('activity');

    return areas;
  }

  private generateImprovementSuggestions(myStats: any, friendStats: any): string[] {
    const suggestions: string[] = [];

    if ((friendStats.win_rate || 0) > (myStats.win_rate || 0) + 5) {
      suggestions.push('Focus on improving win rate through better game sense');
    }
    
    if ((friendStats.kd_ratio || 0) > (myStats.kd_ratio || 0) + 0.2) {
      suggestions.push('Work on aim training and positioning');
    }
    
    if ((friendStats.total_playtime || 0) > (myStats.total_playtime || 0) * 2) {
      suggestions.push('Increase practice time to gain more experience');
    }

    return suggestions;
  }

  async getFriendsList(userId: string): Promise<any[]> {
    try {
      const { data: friends } = await this.supabase
        .from('friends')
        .select(`
          friend_id,
          profiles!friends_friend_id_fkey(id, username, avatar_url),
          status
        `)
        .eq('user_id', userId)
        .eq('status', 'accepted');

      return friends || [];
    } catch (error) {
      console.error('Error fetching friends list:', error);
      return [];
    }
  }

  async sendFriendRequest(userId: string, friendUsername: string): Promise<boolean> {
    try {
      // Find user by username
      const { data: friend } = await this.supabase
        .from('profiles')
        .select('id')
        .eq('username', friendUsername)
        .single();

      if (!friend) return false;

      const { error } = await this.supabase
        .from('friends')
        .insert({
          user_id: userId,
          friend_id: friend.id,
          status: 'pending',
          created_at: new Date().toISOString()
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error sending friend request:', error);
      return false;
    }
  }
}

export const enhancedGamingFeatures = new EnhancedGamingFeatures();
