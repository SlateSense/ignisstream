/**
 * AI-Powered Game Recommendation Engine for IgnisStream
 * Personalized game suggestions based on play patterns, preferences, and social signals
 */

interface GameRecommendation {
  gameId: string;
  title: string;
  description: string;
  imageUrl: string;
  genre: string[];
  rating: number;
  confidence: number;
  reasoningFactors: {
    genreMatch: number;
    playStyleMatch: number;
    friendsPlaying: number;
    trendingScore: number;
    newReleaseBonus: number;
    platformAvailability: number;
  };
  recommendation_reason: string;
  estimatedPlaytime: number;
  price?: {
    current: number;
    original?: number;
    discount?: number;
    platform: string;
  };
  similarGamesYouPlayed: string[];
  friendsWhoPlay: {
    count: number;
    friends: Array<{ name: string; avatar: string; hoursPlayed: number }>;
  };
}

interface UserGameProfile {
  userId: string;
  preferences: {
    favoriteGenres: string[];
    preferredPlatforms: string[];
    playStyleTags: string[];
    difficultyPreference: 'casual' | 'normal' | 'hardcore';
    sessionLength: 'short' | 'medium' | 'long'; // <1h, 1-3h, 3h+
    multiplayerPreference: 'solo' | 'coop' | 'competitive' | 'both';
  };
  playHistory: Array<{
    gameId: string;
    hoursPlayed: number;
    achievementsUnlocked: number;
    lastPlayed: Date;
    rating?: number;
    completionStatus: 'not_started' | 'playing' | 'completed' | 'dropped';
  }>;
  socialSignals: {
    friendsGames: Map<string, number>; // gameId -> friendsCount
    followedStreamersGames: string[];
    wishlistedGames: string[];
    recentlyViewedGames: string[];
  };
  behaviorPatterns: {
    peakPlayingHours: number[];
    averageSessionDuration: number;
    genreDistribution: Map<string, number>;
    platformUsage: Map<string, number>;
    priceRange: { min: number; max: number };
  };
}

interface GameMetadata {
  id: string;
  title: string;
  genres: string[];
  tags: string[];
  platforms: string[];
  releaseDate: Date;
  rating: number;
  reviewCount: number;
  price: number;
  discount?: number;
  estimatedPlaytime: number;
  difficulty: 'easy' | 'medium' | 'hard';
  multiplayerType?: 'none' | 'coop' | 'competitive' | 'both';
  similarGames: string[];
  popularity: {
    currentPlayers: number;
    peakPlayers: number;
    trendingScore: number;
  };
  contentRating: string;
}

export class GameRecommendationEngine {
  private userProfiles: Map<string, UserGameProfile> = new Map();
  private gameDatabase: Map<string, GameMetadata> = new Map();
  private genreVectors: Map<string, number[]> = new Map();
  private collaborativeFilteringMatrix: Map<string, Map<string, number>> = new Map();
  private trendingGames: Set<string> = new Set();

  constructor() {
    this.initializeGenreVectors();
    this.loadGameDatabase();
    this.updateTrendingGames();
  }

  // Initialize genre similarity vectors for content-based filtering
  private initializeGenreVectors(): void {
    const genres = [
      'action', 'adventure', 'rpg', 'strategy', 'simulation', 'sports',
      'racing', 'puzzle', 'horror', 'fps', 'moba', 'mmorpg', 'battle_royale',
      'platformer', 'fighting', 'rhythm', 'survival', 'sandbox', 'roguelike'
    ];

    // Create genre similarity vectors (simplified - in production would use word2vec/BERT)
    genres.forEach((genre, index) => {
      const vector = new Array(genres.length).fill(0);
      vector[index] = 1.0;
      
      // Add some similarity between related genres
      if (genre === 'fps' && genres.includes('action')) {
        vector[genres.indexOf('action')] = 0.7;
      }
      if (genre === 'moba' && genres.includes('strategy')) {
        vector[genres.indexOf('strategy')] = 0.6;
      }
      if (genre === 'rpg' && genres.includes('adventure')) {
        vector[genres.indexOf('adventure')] = 0.5;
      }
      
      this.genreVectors.set(genre, vector);
    });
  }

  // Load game database (in production, this would come from your API)
  private async loadGameDatabase(): Promise<void> {
    // Mock game data - replace with actual database queries
    const mockGames: GameMetadata[] = [
      {
        id: 'valorant',
        title: 'VALORANT',
        genres: ['fps', 'competitive'],
        tags: ['tactical', 'team-based', 'esports'],
        platforms: ['pc'],
        releaseDate: new Date('2020-06-02'),
        rating: 4.2,
        reviewCount: 150000,
        price: 0,
        estimatedPlaytime: 1000,
        difficulty: 'hard',
        multiplayerType: 'competitive',
        similarGames: ['csgo', 'overwatch'],
        popularity: { currentPlayers: 500000, peakPlayers: 1000000, trendingScore: 0.9 },
        contentRating: 'T',
      },
      // Add more games...
    ];

    mockGames.forEach(game => {
      this.gameDatabase.set(game.id, game);
    });
  }

  // Get personalized game recommendations
  async getRecommendations(
    userId: string,
    options: {
      count?: number;
      includeOwned?: boolean;
      priceRange?: { min: number; max: number };
      platforms?: string[];
      genres?: string[];
      onlyNewReleases?: boolean;
    } = {}
  ): Promise<GameRecommendation[]> {
    const {
      count = 10,
      includeOwned = false,
      priceRange,
      platforms,
      genres,
      onlyNewReleases = false,
    } = options;

    // Get or create user profile
    let userProfile = this.userProfiles.get(userId);
    if (!userProfile) {
      userProfile = await this.buildUserProfile(userId);
      this.userProfiles.set(userId, userProfile);
    }

    // Get candidate games
    const candidateGames = this.getCandidateGames(userProfile, {
      includeOwned,
      priceRange,
      platforms,
      genres,
      onlyNewReleases,
    });

    // Calculate recommendations using hybrid approach
    const recommendations: GameRecommendation[] = [];

    for (const game of candidateGames) {
      const recommendation = await this.calculateGameScore(userProfile, game);
      if (recommendation.confidence > 0.3) { // Minimum confidence threshold
        recommendations.push(recommendation);
      }
    }

    // Sort by confidence and return top N
    recommendations.sort((a, b) => b.confidence - a.confidence);
    return recommendations.slice(0, count);
  }

  // Build comprehensive user profile
  private async buildUserProfile(userId: string): Promise<UserGameProfile> {
    // In production, fetch from database
    const profile: UserGameProfile = {
      userId,
      preferences: await this.getUserPreferences(userId),
      playHistory: await this.getPlayHistory(userId),
      socialSignals: await this.getSocialSignals(userId),
      behaviorPatterns: await this.analyzeBehaviorPatterns(userId),
    };

    return profile;
  }

  private async getUserPreferences(userId: string): Promise<UserGameProfile['preferences']> {
    // Mock implementation - replace with database query
    return {
      favoriteGenres: ['fps', 'action', 'competitive'],
      preferredPlatforms: ['pc', 'console'],
      playStyleTags: ['competitive', 'team-based', 'skill-based'],
      difficultyPreference: 'hardcore',
      sessionLength: 'medium',
      multiplayerPreference: 'competitive',
    };
  }

  private async getPlayHistory(userId: string): Promise<UserGameProfile['playHistory']> {
    // Mock implementation
    return [
      {
        gameId: 'valorant',
        hoursPlayed: 500,
        achievementsUnlocked: 25,
        lastPlayed: new Date(),
        rating: 5,
        completionStatus: 'playing',
      },
      // More history...
    ];
  }

  private async getSocialSignals(userId: string): Promise<UserGameProfile['socialSignals']> {
    return {
      friendsGames: new Map([
        ['valorant', 15],
        ['csgo', 8],
        ['overwatch', 12],
      ]),
      followedStreamersGames: ['valorant', 'apex_legends'],
      wishlistedGames: ['cyberpunk_2077', 'elden_ring'],
      recentlyViewedGames: ['halo_infinite', 'cod_warzone'],
    };
  }

  private async analyzeBehaviorPatterns(userId: string): Promise<UserGameProfile['behaviorPatterns']> {
    return {
      peakPlayingHours: [19, 20, 21, 22], // 7-10 PM
      averageSessionDuration: 120, // 2 hours
      genreDistribution: new Map([
        ['fps', 0.6],
        ['action', 0.2],
        ['strategy', 0.1],
        ['rpg', 0.1],
      ]),
      platformUsage: new Map([
        ['pc', 0.8],
        ['console', 0.2],
      ]),
      priceRange: { min: 0, max: 60 },
    };
  }

  // Get candidate games for recommendation
  private getCandidateGames(
    userProfile: UserGameProfile,
    filters: any
  ): GameMetadata[] {
    let candidates = Array.from(this.gameDatabase.values());

    // Apply filters
    if (!filters.includeOwned) {
      const ownedGames = new Set(userProfile.playHistory.map(h => h.gameId));
      candidates = candidates.filter(game => !ownedGames.has(game.id));
    }

    if (filters.priceRange) {
      candidates = candidates.filter(game => 
        game.price >= filters.priceRange.min && game.price <= filters.priceRange.max
      );
    }

    if (filters.platforms?.length) {
      candidates = candidates.filter(game =>
        game.platforms.some(platform => filters.platforms.includes(platform))
      );
    }

    if (filters.genres?.length) {
      candidates = candidates.filter(game =>
        game.genres.some(genre => filters.genres.includes(genre))
      );
    }

    if (filters.onlyNewReleases) {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      candidates = candidates.filter(game => game.releaseDate > threeMonthsAgo);
    }

    return candidates;
  }

  // Calculate comprehensive game score using hybrid recommendation
  private async calculateGameScore(
    userProfile: UserGameProfile,
    game: GameMetadata
  ): Promise<GameRecommendation> {
    const factors = {
      genreMatch: this.calculateGenreMatch(userProfile, game),
      playStyleMatch: this.calculatePlayStyleMatch(userProfile, game),
      friendsPlaying: this.calculateSocialSignal(userProfile, game),
      trendingScore: game.popularity.trendingScore,
      newReleaseBonus: this.calculateNewReleaseBonus(game),
      platformAvailability: this.calculatePlatformMatch(userProfile, game),
    };

    // Weighted scoring
    const weights = {
      genreMatch: 0.25,
      playStyleMatch: 0.20,
      friendsPlaying: 0.20,
      trendingScore: 0.15,
      newReleaseBonus: 0.10,
      platformAvailability: 0.10,
    };

    const confidence = Object.entries(factors).reduce(
      (sum, [factor, score]) => sum + score * weights[factor as keyof typeof weights],
      0
    );

    // Generate reasoning
    const reasoning = this.generateRecommendationReasoning(factors, game, userProfile);

    // Get friends who play this game
    const friendsData = await this.getFriendsWhoPlay(userProfile.userId, game.id);

    // Find similar games user has played
    const similarGamesPlayed = userProfile.playHistory
      .filter(h => game.similarGames.includes(h.gameId))
      .map(h => h.gameId);

    return {
      gameId: game.id,
      title: game.title,
      description: `${game.genres.join(', ')} • ${game.platforms.join(', ')}`,
      imageUrl: `/games/${game.id}/cover.jpg`,
      genre: game.genres,
      rating: game.rating,
      confidence,
      reasoningFactors: factors,
      recommendation_reason: reasoning,
      estimatedPlaytime: game.estimatedPlaytime,
      price: {
        current: game.price,
        original: game.discount ? game.price / (1 - game.discount) : game.price,
        discount: game.discount,
        platform: game.platforms[0],
      },
      similarGamesYouPlayed: similarGamesPlayed,
      friendsWhoPlay: friendsData,
    };
  }

  // Content-based filtering: Genre similarity
  private calculateGenreMatch(userProfile: UserGameProfile, game: GameMetadata): number {
    const userGenrePrefs = userProfile.preferences.favoriteGenres;
    const userGenreHistory = userProfile.behaviorPatterns.genreDistribution;

    let genreScore = 0;
    let totalWeight = 0;

    game.genres.forEach(gameGenre => {
      // Score from explicit preferences
      if (userGenrePrefs.includes(gameGenre)) {
        genreScore += 0.8;
        totalWeight += 0.8;
      }

      // Score from play history
      const historyWeight = userGenreHistory.get(gameGenre) || 0;
      genreScore += historyWeight * 0.6;
      totalWeight += 0.6;
    });

    return totalWeight > 0 ? genreScore / totalWeight : 0;
  }

  // Play style compatibility
  private calculatePlayStyleMatch(userProfile: UserGameProfile, game: GameMetadata): number {
    let score = 0;

    // Difficulty preference
    const difficultyMatch = {
      casual: { easy: 1.0, medium: 0.7, hard: 0.3 },
      normal: { easy: 0.5, medium: 1.0, hard: 0.7 },
      hardcore: { easy: 0.2, medium: 0.6, hard: 1.0 },
    };
    score += difficultyMatch[userProfile.preferences.difficultyPreference][game.difficulty] * 0.3;

    // Multiplayer preference
    if (userProfile.preferences.multiplayerPreference === 'solo' && !game.multiplayerType) {
      score += 0.3;
    } else if (userProfile.preferences.multiplayerPreference === game.multiplayerType) {
      score += 0.4;
    } else if (userProfile.preferences.multiplayerPreference === 'both') {
      score += 0.35;
    }

    // Session length compatibility
    const sessionMatch = this.calculateSessionLengthMatch(userProfile, game);
    score += sessionMatch * 0.3;

    return Math.min(score, 1.0);
  }

  private calculateSessionLengthMatch(userProfile: UserGameProfile, game: GameMetadata): number {
    const avgSession = userProfile.behaviorPatterns.averageSessionDuration;
    const gameSession = this.estimateGameSessionLength(game);

    const difference = Math.abs(avgSession - gameSession) / Math.max(avgSession, gameSession);
    return 1 - difference;
  }

  private estimateGameSessionLength(game: GameMetadata): number {
    // Estimate based on game type and genre
    if (game.genres.includes('moba') || game.genres.includes('battle_royale')) {
      return 45; // 45 minutes average
    }
    if (game.genres.includes('fps') && game.multiplayerType === 'competitive') {
      return 30; // 30 minutes average
    }
    if (game.genres.includes('rpg') || game.genres.includes('simulation')) {
      return 180; // 3 hours average
    }
    return 90; // Default 1.5 hours
  }

  // Collaborative filtering: Social signals
  private calculateSocialSignal(userProfile: UserGameProfile, game: GameMetadata): number {
    let socialScore = 0;

    // Friends playing this game
    const friendsCount = userProfile.socialSignals.friendsGames.get(game.id) || 0;
    socialScore += Math.min(friendsCount / 20, 1.0) * 0.4; // Cap at 20 friends

    // Wishlisted games bonus
    if (userProfile.socialSignals.wishlistedGames.includes(game.id)) {
      socialScore += 0.3;
    }

    // Recently viewed games
    if (userProfile.socialSignals.recentlyViewedGames.includes(game.id)) {
      socialScore += 0.2;
    }

    // Followed streamers playing
    if (userProfile.socialSignals.followedStreamersGames.includes(game.id)) {
      socialScore += 0.1;
    }

    return Math.min(socialScore, 1.0);
  }

  // New release bonus
  private calculateNewReleaseBonus(game: GameMetadata): number {
    const now = new Date();
    const daysSinceRelease = (now.getTime() - game.releaseDate.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceRelease < 30) return 0.8; // Brand new
    if (daysSinceRelease < 90) return 0.6; // Recent
    if (daysSinceRelease < 180) return 0.3; // Somewhat recent
    return 0; // Old
  }

  // Platform availability match
  private calculatePlatformMatch(userProfile: UserGameProfile, game: GameMetadata): number {
    const userPlatforms = userProfile.preferences.preferredPlatforms;
    const commonPlatforms = game.platforms.filter(p => userPlatforms.includes(p));
    return commonPlatforms.length / userPlatforms.length;
  }

  // Generate human-readable recommendation reasoning
  private generateRecommendationReasoning(
    factors: any,
    game: GameMetadata,
    userProfile: UserGameProfile
  ): string {
    const reasons: string[] = [];

    if (factors.genreMatch > 0.7) {
      reasons.push(`matches your favorite ${game.genres.join(' and ')} games`);
    }

    if (factors.friendsPlaying > 0.5) {
      reasons.push('several of your friends are playing this');
    }

    if (factors.trendingScore > 0.7) {
      reasons.push('currently trending in the gaming community');
    }

    if (factors.playStyleMatch > 0.7) {
      reasons.push('fits your preferred difficulty and play style');
    }

    if (factors.newReleaseBonus > 0.5) {
      reasons.push('recently released with positive reviews');
    }

    if (reasons.length === 0) {
      reasons.push('has elements similar to games you\'ve enjoyed');
    }

    return `Recommended because it ${reasons.slice(0, 2).join(' and ')}.`;
  }

  // Get friends who play a specific game
  private async getFriendsWhoPlay(userId: string, gameId: string): Promise<{
    count: number;
    friends: Array<{ name: string; avatar: string; hoursPlayed: number }>;
  }> {
    // Mock implementation - replace with actual database query
    return {
      count: 3,
      friends: [
        { name: 'GamerFriend1', avatar: '/avatars/friend1.jpg', hoursPlayed: 250 },
        { name: 'ProPlayer99', avatar: '/avatars/friend2.jpg', hoursPlayed: 180 },
        { name: 'CasualGamer', avatar: '/avatars/friend3.jpg', hoursPlayed: 45 },
      ],
    };
  }

  // Update trending games based on current data
  private async updateTrendingGames(): Promise<void> {
    // Mock implementation - in production, analyze current player counts, growth rates, etc.
    this.trendingGames = new Set(['valorant', 'apex_legends', 'elden_ring']);
    
    // Update every hour
    setTimeout(() => this.updateTrendingGames(), 3600000);
  }

  // Get recommendations for game discovery page
  async getDiscoveryRecommendations(userId: string): Promise<{
    trending: GameRecommendation[];
    forYou: GameRecommendation[];
    friendsPlaying: GameRecommendation[];
    newReleases: GameRecommendation[];
  }> {
    const [trending, forYou, friendsPlaying, newReleases] = await Promise.all([
      this.getRecommendations(userId, { count: 5, onlyNewReleases: false }),
      this.getRecommendations(userId, { count: 8 }),
      this.getFriendsRecommendations(userId, 6),
      this.getRecommendations(userId, { count: 4, onlyNewReleases: true }),
    ]);

    return { trending, forYou, friendsPlaying, newReleases };
  }

  // Get games friends are playing
  private async getFriendsRecommendations(userId: string, count: number): Promise<GameRecommendation[]> {
    const userProfile = this.userProfiles.get(userId);
    if (!userProfile) return [];

    const friendsGamesEntries = Array.from(userProfile.socialSignals.friendsGames.entries())
      .sort(([, a], [, b]) => b - a) // Sort by friend count
      .slice(0, count);

    const recommendations: GameRecommendation[] = [];

    for (const [gameId, friendCount] of friendsGamesEntries) {
      const game = this.gameDatabase.get(gameId);
      if (game) {
        const recommendation = await this.calculateGameScore(userProfile, game);
        recommendation.recommendation_reason = `${friendCount} of your friends are playing this game`;
        recommendations.push(recommendation);
      }
    }

    return recommendations;
  }

  // Update user preferences based on new data
  async updateUserProfile(userId: string, newData: {
    gameRating?: { gameId: string; rating: number };
    newPlaySession?: { gameId: string; duration: number };
    wishlistAction?: { gameId: string; action: 'add' | 'remove' };
    preferenceUpdate?: Partial<UserGameProfile['preferences']>;
  }): Promise<void> {
    let profile = this.userProfiles.get(userId);
    if (!profile) {
      profile = await this.buildUserProfile(userId);
    }

    // Update based on new data
    if (newData.gameRating) {
      const existingHistory = profile.playHistory.find(h => h.gameId === newData.gameRating!.gameId);
      if (existingHistory) {
        existingHistory.rating = newData.gameRating.rating;
      }
    }

    if (newData.newPlaySession) {
      // Update play patterns
      const session = newData.newPlaySession;
      profile.behaviorPatterns.averageSessionDuration = 
        (profile.behaviorPatterns.averageSessionDuration + session.duration) / 2;
    }

    if (newData.preferenceUpdate) {
      profile.preferences = { ...profile.preferences, ...newData.preferenceUpdate };
    }

    this.userProfiles.set(userId, profile);

    // Optionally save to database
    await this.saveUserProfile(profile);
  }

  private async saveUserProfile(profile: UserGameProfile): Promise<void> {
    // Save to database
    console.log('Saving user profile:', profile.userId);
  }

  // Get explanation for why a game was recommended
  getRecommendationExplanation(recommendation: GameRecommendation): {
    primary: string;
    secondary: string[];
    confidence: string;
  } {
    const factors = recommendation.reasoningFactors;
    const topFactors = Object.entries(factors)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    const explanations = {
      genreMatch: 'Genre preferences match',
      playStyleMatch: 'Play style compatibility',
      friendsPlaying: 'Social influence',
      trendingScore: 'Community popularity',
      newReleaseBonus: 'Recent release',
      platformAvailability: 'Platform availability',
    };

    return {
      primary: recommendation.recommendation_reason,
      secondary: topFactors.map(([factor, score]) => 
        `${explanations[factor as keyof typeof explanations]}: ${Math.round(score * 100)}%`
      ),
      confidence: `${Math.round(recommendation.confidence * 100)}% match`,
    };
  }
}

// Initialize recommendation engine
export const gameRecommendationEngine = new GameRecommendationEngine();
