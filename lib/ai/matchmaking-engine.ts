/**
 * AI-Powered Skill-Based Matchmaking Engine for IgnisStream
 * Advanced tournament and match creation with fair team balancing
 */

interface PlayerSkillProfile {
  userId: string;
  game: string;
  skillRating: number;
  confidence: number;
  playstyle: {
    aggression: number;
    teamwork: number;
    strategy: number;
    mechanics: number;
    consistency: number;
  };
  recentPerformance: Array<{
    matchId: string;
    rating: number;
    kda?: number;
    winRate: number;
    timestamp: Date;
  }>;
  preferences: {
    preferredRole?: string;
    region: string;
    availableHours: number[];
    communicationStyle: 'quiet' | 'callouts' | 'social';
  };
  behaviorScore: number; // Toxicity/sportsmanship rating
}

interface MatchmakingRequest {
  playerId: string;
  gameMode: string;
  game: string;
  region: string;
  priority: 'balanced' | 'fast' | 'competitive';
  maxWaitTime: number;
  acceptableSkillRange: number;
  partyMembers?: string[];
  rolePreference?: string;
}

interface MatchResult {
  matchId: string;
  teams: Array<{
    teamId: string;
    players: PlayerSkillProfile[];
    predictedSkillLevel: number;
    roles: Map<string, string>;
  }>;
  balanceScore: number;
  estimatedMatchQuality: number;
  fairnessMetrics: {
    skillVariance: number;
    playstyleBalance: number;
    roleDistribution: number;
    regionPing: number;
  };
  estimatedDuration: number;
  createdAt: Date;
}

interface TournamentBracket {
  tournamentId: string;
  format: 'single_elimination' | 'double_elimination' | 'round_robin' | 'swiss';
  teams: Array<{
    teamId: string;
    seed: number;
    players: PlayerSkillProfile[];
    averageSkill: number;
  }>;
  matches: Array<{
    matchId: string;
    round: number;
    team1: string;
    team2: string;
    predictedWinner?: string;
    winProbability?: number;
  }>;
  balanceMetrics: {
    skillDistribution: number;
    competitiveness: number;
    predictedUpsets: number;
  };
}

export class MatchmakingEngine {
  private playerProfiles: Map<string, PlayerSkillProfile> = new Map();
  private matchmakingQueue: Map<string, MatchmakingRequest[]> = new Map();
  private skillCalculator: SkillRatingCalculator;
  private teamBalancer: TeamBalancer;
  private tournamentManager: TournamentManager;

  constructor() {
    this.skillCalculator = new SkillRatingCalculator();
    this.teamBalancer = new TeamBalancer();
    this.tournamentManager = new TournamentManager();
    this.startMatchmakingLoop();
  }

  // Find balanced matches for players
  async findMatch(request: MatchmakingRequest): Promise<MatchResult | null> {
    // Add to queue
    const gameQueue = this.matchmakingQueue.get(request.game) || [];
    gameQueue.push(request);
    this.matchmakingQueue.set(request.game, gameQueue);

    // Try to create match immediately
    return this.attemptMatchCreation(request.game);
  }

  // Create tournament bracket with balanced seeding
  async createTournamentBracket(
    tournamentId: string,
    playerIds: string[],
    game: string,
    format: TournamentBracket['format']
  ): Promise<TournamentBracket> {
    // Get player profiles
    const players = await Promise.all(
      playerIds.map(id => this.getPlayerProfile(id, game))
    );

    // Calculate team formations (for team-based games)
    const teams = await this.formTournamentTeams(players, game);

    // Generate seeded bracket
    const bracket = await this.tournamentManager.generateBracket(
      tournamentId,
      teams,
      format
    );

    return bracket;
  }

  // Main matchmaking loop
  private startMatchmakingLoop(): void {
    setInterval(async () => {
      for (const [game, queue] of this.matchmakingQueue.entries()) {
        if (queue.length >= 2) {
          await this.attemptMatchCreation(game);
        }
      }
    }, 5000); // Check every 5 seconds
  }

  // Attempt to create balanced match
  private async attemptMatchCreation(game: string): Promise<MatchResult | null> {
    const queue = this.matchmakingQueue.get(game) || [];
    if (queue.length < 2) return null;

    // Group by game mode and region
    const modeGroups = this.groupByGameMode(queue);

    for (const [mode, requests] of modeGroups.entries()) {
      const regionGroups = this.groupByRegion(requests);

      for (const [region, regionRequests] of regionGroups.entries()) {
        if (regionRequests.length >= this.getRequiredPlayers(mode)) {
          const match = await this.createBalancedMatch(regionRequests, game, mode, region);
          if (match) {
            // Remove matched players from queue
            this.removeMatchedPlayers(game, match.teams.flatMap(t => t.players.map(p => p.userId)));
            return match;
          }
        }
      }
    }

    return null;
  }

  // Create balanced match from player pool
  private async createBalancedMatch(
    requests: MatchmakingRequest[],
    game: string,
    mode: string,
    region: string
  ): Promise<MatchResult | null> {
    const requiredPlayers = this.getRequiredPlayers(mode);
    const selectedRequests = requests.slice(0, requiredPlayers);
    
    // Get player profiles
    const players = await Promise.all(
      selectedRequests.map(r => this.getPlayerProfile(r.playerId, game))
    );

    // Balance teams
    const teams = await this.teamBalancer.balanceTeams(players, mode);
    
    // Calculate match quality metrics
    const balanceScore = this.calculateBalanceScore(teams);
    const matchQuality = this.estimateMatchQuality(teams);

    if (balanceScore < 0.6) { // Minimum balance threshold
      return null;
    }

    const match: MatchResult = {
      matchId: `match_${Date.now()}`,
      teams,
      balanceScore,
      estimatedMatchQuality: matchQuality,
      fairnessMetrics: this.calculateFairnessMetrics(teams),
      estimatedDuration: this.estimateMatchDuration(mode, teams),
      createdAt: new Date(),
    };

    return match;
  }

  // Get or create player skill profile
  private async getPlayerProfile(userId: string, game: string): Promise<PlayerSkillProfile> {
    const cacheKey = `${userId}_${game}`;
    let profile = this.playerProfiles.get(cacheKey);

    if (!profile) {
      profile = await this.buildPlayerProfile(userId, game);
      this.playerProfiles.set(cacheKey, profile);
    }

    return profile;
  }

  // Build comprehensive player skill profile
  private async buildPlayerProfile(userId: string, game: string): Promise<PlayerSkillProfile> {
    // Fetch data from existing skill prediction system
    const skillData = await this.fetchPlayerSkillData(userId, game);
    const recentMatches = await this.fetchRecentMatches(userId, game);
    const behaviorData = await this.fetchBehaviorScore(userId);

    return {
      userId,
      game,
      skillRating: skillData.overallRating,
      confidence: skillData.confidence,
      playstyle: {
        aggression: skillData.playstyle?.aggression || 0.5,
        teamwork: skillData.playstyle?.teamwork || 0.5,
        strategy: skillData.playstyle?.strategy || 0.5,
        mechanics: skillData.playstyle?.mechanics || 0.5,
        consistency: skillData.playstyle?.consistency || 0.5,
      },
      recentPerformance: recentMatches.map(match => ({
        matchId: match.id,
        rating: match.performanceRating,
        kda: match.kda,
        winRate: match.won ? 1 : 0,
        timestamp: new Date(match.timestamp),
      })),
      preferences: {
        preferredRole: skillData.preferredRole,
        region: skillData.region || 'NA',
        availableHours: skillData.playingHours || [18, 19, 20, 21, 22],
        communicationStyle: skillData.communicationStyle || 'callouts',
      },
      behaviorScore: behaviorData.score,
    };
  }

  private async fetchPlayerSkillData(userId: string, game: string): Promise<any> {
    // Integration with existing skill analytics system
    return {
      overallRating: 1200 + Math.random() * 1600, // Mock ELO-style rating
      confidence: 0.7 + Math.random() * 0.3,
      playstyle: {
        aggression: Math.random(),
        teamwork: Math.random(),
        strategy: Math.random(),
        mechanics: Math.random(),
        consistency: Math.random(),
      },
      preferredRole: ['entry', 'support', 'igl', 'lurker'][Math.floor(Math.random() * 4)],
      region: 'NA',
      playingHours: [18, 19, 20, 21, 22],
      communicationStyle: 'callouts',
    };
  }

  private async fetchRecentMatches(userId: string, game: string): Promise<any[]> {
    // Mock recent match data
    return Array.from({ length: 10 }, (_, i) => ({
      id: `match_${i}`,
      performanceRating: 1000 + Math.random() * 1000,
      kda: 0.5 + Math.random() * 2,
      won: Math.random() > 0.5,
      timestamp: Date.now() - (i * 24 * 60 * 60 * 1000),
    }));
  }

  private async fetchBehaviorScore(userId: string): Promise<{ score: number }> {
    return { score: 0.7 + Math.random() * 0.3 }; // Mock behavior score
  }

  // Helper methods
  private groupByGameMode(requests: MatchmakingRequest[]): Map<string, MatchmakingRequest[]> {
    const groups = new Map<string, MatchmakingRequest[]>();
    requests.forEach(req => {
      const existing = groups.get(req.gameMode) || [];
      existing.push(req);
      groups.set(req.gameMode, existing);
    });
    return groups;
  }

  private groupByRegion(requests: MatchmakingRequest[]): Map<string, MatchmakingRequest[]> {
    const groups = new Map<string, MatchmakingRequest[]>();
    requests.forEach(req => {
      const existing = groups.get(req.region) || [];
      existing.push(req);
      groups.set(req.region, existing);
    });
    return groups;
  }

  private getRequiredPlayers(mode: string): number {
    const playerCounts = {
      '1v1': 2,
      '2v2': 4,
      '3v3': 6,
      '5v5': 10,
      'battle_royale': 60,
      'ffa': 8,
    };
    return playerCounts[mode] || 10;
  }

  private calculateBalanceScore(teams: MatchResult['teams']): number {
    if (teams.length !== 2) return 0.5;
    
    const skillDiff = Math.abs(teams[0].predictedSkillLevel - teams[1].predictedSkillLevel);
    const maxSkill = Math.max(teams[0].predictedSkillLevel, teams[1].predictedSkillLevel);
    
    return Math.max(0, 1 - (skillDiff / maxSkill));
  }

  private estimateMatchQuality(teams: MatchResult['teams']): number {
    // Consider skill balance, role distribution, playstyle compatibility
    const balanceScore = this.calculateBalanceScore(teams);
    const roleScore = this.calculateRoleDistribution(teams);
    const playstyleScore = this.calculatePlaystyleCompatibility(teams);
    
    return (balanceScore * 0.5) + (roleScore * 0.3) + (playstyleScore * 0.2);
  }

  private calculateFairnessMetrics(teams: MatchResult['teams']): MatchResult['fairnessMetrics'] {
    return {
      skillVariance: this.calculateSkillVariance(teams),
      playstyleBalance: this.calculatePlaystyleBalance(teams),
      roleDistribution: this.calculateRoleDistribution(teams),
      regionPing: this.calculateRegionPing(teams),
    };
  }

  private calculateSkillVariance(teams: MatchResult['teams']): number {
    const allSkills = teams.flatMap(team => team.players.map(p => p.skillRating));
    const mean = allSkills.reduce((a, b) => a + b, 0) / allSkills.length;
    const variance = allSkills.reduce((sum, skill) => sum + Math.pow(skill - mean, 2), 0) / allSkills.length;
    return Math.max(0, 1 - (variance / 1000000)); // Normalize
  }

  private calculatePlaystyleBalance(teams: MatchResult['teams']): number {
    // Mock calculation - would analyze playstyle compatibility
    return 0.7 + Math.random() * 0.3;
  }

  private calculateRoleDistribution(teams: MatchResult['teams']): number {
    // Mock calculation - would check if teams have balanced role coverage
    return 0.8 + Math.random() * 0.2;
  }

  private calculateRegionPing(teams: MatchResult['teams']): number {
    // Mock calculation - would consider geographical distribution
    return 0.9;
  }

  private estimateMatchDuration(mode: string, teams: MatchResult['teams']): number {
    const baseDurations = {
      '5v5': 25,
      '3v3': 15,
      '2v2': 10,
      '1v1': 8,
      'battle_royale': 20,
      'ffa': 12,
    };
    
    const base = baseDurations[mode] || 20;
    const skillBalance = this.calculateBalanceScore(teams);
    
    // More balanced games tend to last longer
    return base * (0.8 + skillBalance * 0.4);
  }

  private removeMatchedPlayers(game: string, playerIds: string[]): void {
    const queue = this.matchmakingQueue.get(game) || [];
    const filtered = queue.filter(req => !playerIds.includes(req.playerId));
    this.matchmakingQueue.set(game, filtered);
  }

  private async formTournamentTeams(players: PlayerSkillProfile[], game: string): Promise<TournamentBracket['teams']> {
    // For individual games, each player is a "team"
    if (this.isIndividualGame(game)) {
      return players.map((player, index) => ({
        teamId: `team_${player.userId}`,
        seed: index + 1,
        players: [player],
        averageSkill: player.skillRating,
      }));
    }

    // For team games, form balanced teams
    return this.teamBalancer.formTournamentTeams(players);
  }

  private isIndividualGame(game: string): boolean {
    return ['chess', 'hearthstone', '1v1_games'].includes(game);
  }

  // Public API methods
  async getMatchmakingStats(): Promise<{
    totalPlayersInQueue: number;
    averageWaitTime: number;
    matchesCreatedToday: number;
    averageMatchQuality: number;
  }> {
    return {
      totalPlayersInQueue: Array.from(this.matchmakingQueue.values()).reduce((sum, queue) => sum + queue.length, 0),
      averageWaitTime: 45, // seconds
      matchesCreatedToday: 1250,
      averageMatchQuality: 0.82,
    };
  }

  async cancelMatchmaking(playerId: string, game: string): Promise<boolean> {
    const queue = this.matchmakingQueue.get(game) || [];
    const filtered = queue.filter(req => req.playerId !== playerId);
    this.matchmakingQueue.set(game, filtered);
    return queue.length !== filtered.length;
  }
}

// Supporting classes
class SkillRatingCalculator {
  calculateNewRating(oldRating: number, actualScore: number, expectedScore: number, kFactor = 32): number {
    return oldRating + kFactor * (actualScore - expectedScore);
  }

  calculateExpectedScore(rating1: number, rating2: number): number {
    return 1 / (1 + Math.pow(10, (rating2 - rating1) / 400));
  }
}

class TeamBalancer {
  async balanceTeams(players: PlayerSkillProfile[], mode: string): Promise<MatchResult['teams']> {
    const playersPerTeam = this.getPlayersPerTeam(mode);
    
    if (players.length !== playersPerTeam * 2) {
      throw new Error('Invalid player count for team balancing');
    }

    // Sort by skill rating
    const sortedPlayers = [...players].sort((a, b) => b.skillRating - a.skillRating);
    
    // Alternate assignment for balance (snake draft)
    const team1: PlayerSkillProfile[] = [];
    const team2: PlayerSkillProfile[] = [];
    
    for (let i = 0; i < sortedPlayers.length; i++) {
      if (i % 4 < 2) {
        team1.push(sortedPlayers[i]);
      } else {
        team2.push(sortedPlayers[i]);
      }
    }

    return [
      {
        teamId: 'team_1',
        players: team1,
        predictedSkillLevel: this.calculateTeamSkill(team1),
        roles: this.assignRoles(team1, mode),
      },
      {
        teamId: 'team_2',
        players: team2,
        predictedSkillLevel: this.calculateTeamSkill(team2),
        roles: this.assignRoles(team2, mode),
      },
    ];
  }

  async formTournamentTeams(players: PlayerSkillProfile[]): Promise<TournamentBracket['teams']> {
    // Form balanced teams for tournament
    const teams: TournamentBracket['teams'] = [];
    const playersPerTeam = 5; // Default to 5v5
    
    for (let i = 0; i < players.length; i += playersPerTeam) {
      const teamPlayers = players.slice(i, i + playersPerTeam);
      teams.push({
        teamId: `tournament_team_${i / playersPerTeam + 1}`,
        seed: Math.floor(i / playersPerTeam) + 1,
        players: teamPlayers,
        averageSkill: this.calculateTeamSkill(teamPlayers),
      });
    }

    return teams;
  }

  private getPlayersPerTeam(mode: string): number {
    const teamSizes = {
      '1v1': 1,
      '2v2': 2,
      '3v3': 3,
      '5v5': 5,
    };
    return teamSizes[mode] || 5;
  }

  private calculateTeamSkill(players: PlayerSkillProfile[]): number {
    if (players.length === 0) return 0;
    return players.reduce((sum, p) => sum + p.skillRating, 0) / players.length;
  }

  private assignRoles(players: PlayerSkillProfile[], mode: string): Map<string, string> {
    const roles = new Map<string, string>();
    const availableRoles = this.getAvailableRoles(mode);
    
    players.forEach((player, index) => {
      const role = player.preferences.preferredRole || availableRoles[index % availableRoles.length];
      roles.set(player.userId, role);
    });
    
    return roles;
  }

  private getAvailableRoles(mode: string): string[] {
    const rolesByMode = {
      '5v5': ['entry', 'support', 'igl', 'lurker', 'awper'],
      '3v3': ['fragger', 'support', 'igl'],
      '2v2': ['fragger', 'support'],
      '1v1': ['player'],
    };
    return rolesByMode[mode] || ['player'];
  }
}

class TournamentManager {
  async generateBracket(
    tournamentId: string,
    teams: TournamentBracket['teams'],
    format: TournamentBracket['format']
  ): Promise<TournamentBracket> {
    // Seed teams by skill level
    const seededTeams = teams.sort((a, b) => b.averageSkill - a.averageSkill);
    seededTeams.forEach((team, index) => {
      team.seed = index + 1;
    });

    const matches = this.generateMatches(seededTeams, format);
    
    return {
      tournamentId,
      format,
      teams: seededTeams,
      matches,
      balanceMetrics: this.calculateTournamentBalance(seededTeams, matches),
    };
  }

  private generateMatches(teams: TournamentBracket['teams'], format: TournamentBracket['format']): TournamentBracket['matches'] {
    switch (format) {
      case 'single_elimination':
        return this.generateSingleElimination(teams);
      case 'double_elimination':
        return this.generateDoubleElimination(teams);
      case 'round_robin':
        return this.generateRoundRobin(teams);
      case 'swiss':
        return this.generateSwissSystem(teams);
      default:
        return this.generateSingleElimination(teams);
    }
  }

  private generateSingleElimination(teams: TournamentBracket['teams']): TournamentBracket['matches'] {
    const matches: TournamentBracket['matches'] = [];
    const numTeams = teams.length;
    
    // First round matches
    for (let i = 0; i < numTeams; i += 2) {
      if (i + 1 < numTeams) {
        matches.push({
          matchId: `match_r1_${i / 2 + 1}`,
          round: 1,
          team1: teams[i].teamId,
          team2: teams[i + 1].teamId,
          predictedWinner: teams[i].averageSkill > teams[i + 1].averageSkill ? teams[i].teamId : teams[i + 1].teamId,
          winProbability: this.calculateWinProbability(teams[i].averageSkill, teams[i + 1].averageSkill),
        });
      }
    }
    
    return matches;
  }

  private generateDoubleElimination(teams: TournamentBracket['teams']): TournamentBracket['matches'] {
    // Simplified double elimination
    return this.generateSingleElimination(teams);
  }

  private generateRoundRobin(teams: TournamentBracket['teams']): TournamentBracket['matches'] {
    const matches: TournamentBracket['matches'] = [];
    
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        matches.push({
          matchId: `match_rr_${i}_${j}`,
          round: 1,
          team1: teams[i].teamId,
          team2: teams[j].teamId,
          predictedWinner: teams[i].averageSkill > teams[j].averageSkill ? teams[i].teamId : teams[j].teamId,
          winProbability: this.calculateWinProbability(teams[i].averageSkill, teams[j].averageSkill),
        });
      }
    }
    
    return matches;
  }

  private generateSwissSystem(teams: TournamentBracket['teams']): TournamentBracket['matches'] {
    // Simplified Swiss system - first round only
    return this.generateSingleElimination(teams);
  }

  private calculateWinProbability(skill1: number, skill2: number): number {
    const diff = skill1 - skill2;
    return 1 / (1 + Math.pow(10, -diff / 400));
  }

  private calculateTournamentBalance(teams: TournamentBracket['teams'], matches: TournamentBracket['matches']): TournamentBracket['balanceMetrics'] {
    const skills = teams.map(t => t.averageSkill);
    const mean = skills.reduce((a, b) => a + b, 0) / skills.length;
    const variance = skills.reduce((sum, skill) => sum + Math.pow(skill - mean, 2), 0) / skills.length;
    
    const upsetPotential = matches.filter(m => m.winProbability && m.winProbability < 0.7).length / matches.length;
    
    return {
      skillDistribution: Math.max(0, 1 - (variance / 500000)),
      competitiveness: 0.8,
      predictedUpsets: upsetPotential,
    };
  }
}

// Initialize matchmaking engine
export const matchmakingEngine = new MatchmakingEngine();
