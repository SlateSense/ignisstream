import { createClient } from '@/lib/supabase/client';

export interface SteamProfile {
  steamId: string;
  personaName: string;
  profileUrl: string;
  avatar: string;
  avatarMedium: string;
  avatarFull: string;
  personaState: number;
  communityVisibilityState: number;
  profileState: number;
  lastLogoff: number;
  commentPermission: number;
}

export interface SteamGame {
  appid: number;
  name: string;
  playtime_forever: number;
  img_icon_url: string;
  img_logo_url: string;
  playtime_windows_forever?: number;
  playtime_mac_forever?: number;
  playtime_linux_forever?: number;
}

export interface SteamAchievement {
  apiname: string;
  achieved: number;
  unlocktime: number;
  name: string;
  description: string;
}

export interface GameStats {
  game_id: string;
  platform: 'steam' | 'epic' | 'xbox' | 'playstation' | 'riot' | 'battle_net';
  user_id: string;
  username: string;
  total_playtime: number;
  achievements_unlocked: number;
  total_achievements: number;
  last_played: string;
  level: number;
  xp: number;
  rank?: string;
  tier?: string;
  division?: string;
  lp?: number;
  matches_played?: number;
  wins?: number;
  losses?: number;
  kd_ratio?: number;
  win_rate?: number;
  adr?: number; // Average Damage per Round
  headshot_percentage?: number;
  recent_matches: MatchHistory[];
  competitive_rank?: CompetitiveRank;
}

export interface MatchHistory {
  match_id: string;
  game_id: string;
  platform: string;
  date_played: string;
  duration: number;
  result: 'win' | 'loss' | 'draw';
  score?: string;
  kills?: number;
  deaths?: number;
  assists?: number;
  damage_dealt?: number;
  damage_taken?: number;
  game_mode: string;
  map?: string;
  rank_change?: number;
}

export interface EpicGamesProfile {
  accountId: string;
  displayName: string;
  preferredLanguage: string;
}

export interface XboxProfile {
  id: string;
  hostId: string;
  settings: Array<{
    id: string;
    value: string;
  }>;
  isSponsoredUser: boolean;
}

export interface RiotAccount {
  puuid: string;
  gameName: string;
  tagLine: string;
}

export interface ValorantMatch {
  matchInfo: {
    matchId: string;
    mapId: string;
    gameMode: string;
    queueId: string;
    seasonId: string;
    gameStartMillis: number;
    gameLengthMillis: number;
  };
  players: ValorantPlayer[];
  teams: ValorantTeam[];
  roundResults: RoundResult[];
}

export interface ValorantPlayer {
  puuid: string;
  gameName: string;
  tagLine: string;
  teamId: string;
  characterId: string;
  stats: {
    score: number;
    roundsPlayed: number;
    kills: number;
    deaths: number;
    assists: number;
    playtimeMillis: number;
  };
  competitiveTier: number;
  playerCard: string;
  playerTitle: string;
}

export interface ValorantTeam {
  teamId: string;
  won: boolean;
  roundsPlayed: number;
  roundsWon: number;
}

export interface RoundResult {
  roundNum: number;
  roundResult: string;
  roundCeremony: string;
  winningTeam: string;
}

export interface CompetitiveRank {
  currentTier: number;
  currentTierPatched: string;
  ranking: number;
  mmrChangeToLastGame: number;
  elo: number;
}

export interface BlizzardProfile {
  id: number;
  battletag: string;
}

// PlayStation Network Interfaces
export interface PSNProfile {
  accountId: string;
  onlineId: string;
  npId: string;
  avatarUrls: Array<{
    size: string;
    avatarUrl: string;
  }>;
  plus: number;
  aboutMe: string;
  languagesUsed: string[];
  trophySummary: {
    level: number;
    progress: number;
    earnedTrophies: {
      platinum: number;
      gold: number;
      silver: number;
      bronze: number;
    };
  };
}

export interface PSNGame {
  npCommunicationId: string;
  trophyTitleName: string;
  trophyTitleDetail: string;
  trophyTitleIconUrl: string;
  trophyTitlePlatform: string;
  hasTrophyGroups: boolean;
  definedTrophies: {
    platinum: number;
    gold: number;
    silver: number;
    bronze: number;
  };
  progress: number;
  earnedTrophies: {
    platinum: number;
    gold: number;
    silver: number;
    bronze: number;
  };
  lastUpdatedDateTime: string;
}

// Nintendo Switch Interfaces
export interface NintendoProfile {
  id: string;
  name: string;
  imageUri: string;
  friendCode: string;
  presence: {
    state: string;
    game?: {
      name: string;
      imageUri: string;
      shopUri: string;
      totalPlayTime: number;
    };
  };
}

export interface NintendoGame {
  applicationId: string;
  name: string;
  imageUri: string;
  shopUri: string;
  totalPlayTime: number;
  firstPlayedAt: string;
  lastPlayedAt: string;
}

// GOG Galaxy Interfaces
export interface GOGProfile {
  userId: string;
  username: string;
  avatar: {
    sdk_img_32: string;
    sdk_img_64: string;
    sdk_img_184: string;
  };
  country: string;
  currencies: string[];
}

export interface GOGGame {
  id: number;
  title: string;
  category: string;
  rating: number;
  releaseDate: number;
  availableLanguages: {
    [key: string]: string[];
  };
  supportedOperatingSystems: string[];
  gameTime: number;
  lastPlayed?: number;
}

// Enhanced Analytics Interfaces
export interface SkillPrediction {
  userId: string;
  gameId: string;
  predictedRank: string;
  confidence: number;
  improvementAreas: string[];
  timeToNextRank: number; // in hours
  skillTrends: {
    aim: number;
    strategy: number;
    teamwork: number;
    positioning: number;
  };
}

export interface PlayPattern {
  peakHours: number[];
  preferredGameModes: string[];
  sessionDuration: {
    average: number;
    longest: number;
    shortest: number;
  };
  skillProgression: {
    trend: 'improving' | 'declining' | 'stable';
    rate: number;
    lastUpdated: string;
  };
  gamePreferences: {
    genres: Record<string, number>;
    platforms: Record<string, number>;
    difficulty: 'casual' | 'competitive' | 'hardcore';
  };
}

// Tournament & Social Interfaces
export interface Tournament {
  id: string;
  name: string;
  gameId: string;
  description: string;
  format: 'single_elimination' | 'double_elimination' | 'round_robin' | 'swiss';
  maxParticipants: number;
  entryFee?: number;
  prizePool?: number;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  rules: string;
  participants: TournamentParticipant[];
  matches: TournamentMatch[];
  createdBy: string;
  moderators: string[];
}

export interface TournamentParticipant {
  userId: string;
  username: string;
  skillRating: number;
  registeredAt: string;
  status: 'registered' | 'active' | 'eliminated' | 'winner';
}

export interface TournamentMatch {
  id: string;
  tournamentId: string;
  round: number;
  participant1Id: string;
  participant2Id: string;
  winnerId?: string;
  score?: string;
  scheduledTime: string;
  completedTime?: string;
  status: 'scheduled' | 'active' | 'completed' | 'forfeit';
}

export interface FriendComparison {
  friend: {
    userId: string;
    username: string;
    avatarUrl?: string;
  };
  games: {
    gameId: string;
    gameName: string;
    myStats: GameStats;
    friendStats: GameStats;
    comparison: {
      skillDifference: number;
      playtimeDifference: number;
      winRateDifference: number;
      strongerAreas: string[];
      improvementSuggestions: string[];
    };
  }[];
  overallComparison: {
    totalGamesInCommon: number;
    myAverageSkill: number;
    friendAverageSkill: number;
    recommendation: 'invite_to_team' | 'practice_together' | 'learn_from_friend' | 'mentor_friend';
  };
}

// Real-time Update Interfaces
export interface LiveMatchUpdate {
  matchId: string;
  gameId: string;
  timestamp: string;
  type: 'kill' | 'death' | 'objective' | 'round_end' | 'match_end';
  playerId: string;
  data: Record<string, any>;
}

export interface WebSocketMessage {
  type: 'match_update' | 'friend_online' | 'achievement_unlocked' | 'tournament_update' | 'friend_match_update' | 'friend_activity' | 'connection_established' | 'player_joined' | 'player_left' | 'participant_joined' | 'match_completed' | 'round_advanced' | 'skill_prediction_updated';
  payload: any;
  timestamp: string;
}

export interface OverwatchStats {
  competitiveStats: {
    careerStats: any;
    games: {
      won: number;
      played: number;
    };
  };
  quickPlayStats: {
    careerStats: any;
    games: {
      won: number;
      played: number;
    };
  };
}

export class GameAPIManager {
  private supabase = createClient();
  private steamApiKey: string;
  private epicClientId: string;
  private epicClientSecret: string;
  private riotApiKey: string;
  private blizzardClientId: string;
  private blizzardClientSecret: string;
  private psnClientId: string;
  private psnClientSecret: string;
  private nintendoClientId: string;
  private nintendoClientSecret: string;
  private gogClientId: string;
  private gogClientSecret: string;
  private websocketConnections: Map<string, WebSocket> = new Map();

  constructor() {
    this.steamApiKey = process.env.NEXT_PUBLIC_STEAM_API_KEY || '';
    this.epicClientId = process.env.NEXT_PUBLIC_EPIC_CLIENT_ID || '';
    this.epicClientSecret = process.env.NEXT_PUBLIC_EPIC_CLIENT_SECRET || '';
    this.riotApiKey = process.env.NEXT_PUBLIC_RIOT_API_KEY || '';
    this.blizzardClientId = process.env.NEXT_PUBLIC_BLIZZARD_CLIENT_ID || '';
    this.blizzardClientSecret = process.env.NEXT_PUBLIC_BLIZZARD_CLIENT_SECRET || '';
    this.psnClientId = process.env.NEXT_PUBLIC_PSN_CLIENT_ID || '';
    this.psnClientSecret = process.env.NEXT_PUBLIC_PSN_CLIENT_SECRET || '';
    this.nintendoClientId = process.env.NEXT_PUBLIC_NINTENDO_CLIENT_ID || '';
    this.nintendoClientSecret = process.env.NEXT_PUBLIC_NINTENDO_CLIENT_SECRET || '';
    this.gogClientId = process.env.NEXT_PUBLIC_GOG_CLIENT_ID || '';
    this.gogClientSecret = process.env.NEXT_PUBLIC_GOG_CLIENT_SECRET || '';
  }

  // Steam Integration
  async connectSteamAccount(userId: string, steamId: string): Promise<boolean> {
    try {
      // Validate Steam ID and get profile
      const profile = await this.getSteamProfile(steamId);
      if (!profile) {
        throw new Error('Invalid Steam ID or profile not found');
      }

      // Store connection in database
      const { error } = await this.supabase
        .from('user_game_accounts')
        .upsert({
          user_id: userId,
          platform: 'steam',
          platform_user_id: steamId,
          platform_username: profile.personaName,
          profile_data: profile,
          connected_at: new Date().toISOString(),
          is_active: true
        });

      if (error) throw error;

      // Import initial game data
      await this.importSteamGames(userId, steamId);
      
      return true;
    } catch (error) {
      console.error('Error connecting Steam account:', error);
      return false;
    }
  }

  async getSteamProfile(steamId: string): Promise<SteamProfile | null> {
    try {
      const response = await fetch(
        `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${this.steamApiKey}&steamids=${steamId}`
      );
      
      if (!response.ok) return null;
      
      const data = await response.json();
      return data.response.players[0] || null;
    } catch (error) {
      console.error('Error fetching Steam profile:', error);
      return null;
    }
  }

  async getSteamOwnedGames(steamId: string): Promise<SteamGame[]> {
    try {
      const response = await fetch(
        `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${this.steamApiKey}&steamid=${steamId}&format=json&include_appinfo=true&include_played_free_games=true`
      );
      
      if (!response.ok) return [];
      
      const data = await response.json();
      return data.response.games || [];
    } catch (error) {
      console.error('Error fetching Steam games:', error);
      return [];
    }
  }

  async getSteamRecentGames(steamId: string): Promise<SteamGame[]> {
    try {
      const response = await fetch(
        `https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/?key=${this.steamApiKey}&steamid=${steamId}&format=json`
      );
      
      if (!response.ok) return [];
      
      const data = await response.json();
      return data.response.games || [];
    } catch (error) {
      console.error('Error fetching Steam recent games:', error);
      return [];
    }
  }

  async getSteamAchievements(steamId: string, appId: number): Promise<SteamAchievement[]> {
    try {
      const response = await fetch(
        `https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?appid=${appId}&key=${this.steamApiKey}&steamid=${steamId}`
      );
      
      if (!response.ok) return [];
      
      const data = await response.json();
      return data.playerstats?.achievements || [];
    } catch (error) {
      console.error('Error fetching Steam achievements:', error);
      return [];
    }
  }

  private async importSteamGames(userId: string, steamId: string): Promise<void> {
    try {
      const games = await this.getSteamOwnedGames(steamId);
      const recentGames = await this.getSteamRecentGames(steamId);
      
      for (const game of games) {
        // Check if game exists in our database
        let { data: existingGame } = await this.supabase
          .from('games')
          .select('id')
          .eq('steam_app_id', game.appid)
          .single();

        if (!existingGame) {
          // Create game entry
          const { data: newGame } = await this.supabase
            .from('games')
            .insert({
              name: game.name,
              steam_app_id: game.appid,
              cover_url: `https://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_logo_url}.jpg`,
              platform: 'steam'
            })
            .select('id')
            .single();

          existingGame = newGame;
        }

        if (existingGame) {
          // Create or update user game stats
          await this.supabase
            .from('user_game_stats')
            .upsert({
              user_id: userId,
              game_id: existingGame.id,
              platform: 'steam',
              total_playtime: game.playtime_forever,
              last_played: recentGames.find(rg => rg.appid === game.appid) ? new Date().toISOString() : null,
              updated_at: new Date().toISOString()
            });
        }
      }
    } catch (error) {
      console.error('Error importing Steam games:', error);
    }
  }

  // Epic Games Integration
  async connectEpicAccount(userId: string, authCode: string): Promise<boolean> {
    try {
      // Exchange auth code for access token
      const tokenResponse = await fetch('https://api.epicgames.dev/epic/oauth/v1/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: authCode,
          client_id: this.epicClientId,
          client_secret: this.epicClientSecret,
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to exchange Epic Games auth code');
      }

      const tokens = await tokenResponse.json();
      
      // Get user profile
      const profile = await this.getEpicProfile(tokens.access_token);
      if (!profile) {
        throw new Error('Failed to get Epic Games profile');
      }

      // Store connection
      const { error } = await this.supabase
        .from('user_game_accounts')
        .upsert({
          user_id: userId,
          platform: 'epic',
          platform_user_id: profile.accountId,
          platform_username: profile.displayName,
          profile_data: profile,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
          connected_at: new Date().toISOString(),
          is_active: true
        });

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error connecting Epic Games account:', error);
      return false;
    }
  }

  private async getEpicProfile(accessToken: string): Promise<EpicGamesProfile | null> {
    try {
      const response = await fetch('https://api.epicgames.dev/epic/id/v1/accounts', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) return null;

      const data = await response.json();
      return data[0] || null;
    } catch (error) {
      console.error('Error fetching Epic Games profile:', error);
      return null;
    }
  }

  // Xbox Live Integration
  async connectXboxAccount(userId: string, xboxLiveId: string, gamertag: string): Promise<boolean> {
    try {
      // Note: Xbox Live API requires special partnership/certification
      // This is a simplified implementation
      
      const profile = {
        id: xboxLiveId,
        gamertag: gamertag,
        connectedAt: new Date().toISOString()
      };

      const { error } = await this.supabase
        .from('user_game_accounts')
        .upsert({
          user_id: userId,
          platform: 'xbox',
          platform_user_id: xboxLiveId,
          platform_username: gamertag,
          profile_data: profile,
          connected_at: new Date().toISOString(),
          is_active: true
        });

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error connecting Xbox account:', error);
      return false;
    }
  }

  // Game Statistics
  async getUserGameStats(userId: string, gameId?: string): Promise<GameStats[]> {
    try {
      let query = this.supabase
        .from('user_game_stats')
        .select(`
          *,
          game:games(id, name, cover_url, steam_app_id),
          recent_matches:match_history(*)
        `)
        .eq('user_id', userId);

      if (gameId) {
        query = query.eq('game_id', gameId);
      }

      const { data, error } = await query
        .order('last_played', { ascending: false })
        .limit(50);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching user game stats:', error);
      return [];
    }
  }

  async updateGameStats(userId: string, gameId: string, stats: Partial<GameStats>): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('user_game_stats')
        .upsert({
          user_id: userId,
          game_id: gameId,
          ...stats,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating game stats:', error);
    }
  }

  async recordMatch(userId: string, matchData: MatchHistory): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('match_history')
        .insert({
          ...matchData,
          user_id: userId,
          recorded_at: new Date().toISOString()
        });

      if (error) throw error;

      // Update aggregate stats
      await this.updateAggregateStats(userId, matchData.game_id, matchData);
    } catch (error) {
      console.error('Error recording match:', error);
    }
  }

  private async updateAggregateStats(userId: string, gameId: string, match: MatchHistory): Promise<void> {
    try {
      const { data: currentStats } = await this.supabase
        .from('user_game_stats')
        .select('*')
        .eq('user_id', userId)
        .eq('game_id', gameId)
        .single();

      if (currentStats) {
        const newStats: any = {
          matches_played: (currentStats.matches_played || 0) + 1,
          wins: currentStats.wins + (match.result === 'win' ? 1 : 0),
          losses: currentStats.losses + (match.result === 'loss' ? 1 : 0),
          total_playtime: currentStats.total_playtime + match.duration,
          last_played: match.date_played
        };

        // Calculate derived stats
        newStats.win_rate = (newStats.wins / newStats.matches_played) * 100;
        
        if (match.kills !== undefined && match.deaths !== undefined) {
          const totalKills = (currentStats.total_kills || 0) + match.kills;
          const totalDeaths = (currentStats.total_deaths || 0) + match.deaths;
          newStats.total_kills = totalKills;
          newStats.total_deaths = totalDeaths;
          newStats.kd_ratio = totalDeaths > 0 ? totalKills / totalDeaths : totalKills;
        }

        await this.supabase
          .from('user_game_stats')
          .update(newStats)
          .eq('user_id', userId)
          .eq('game_id', gameId);
      }
    } catch (error) {
      console.error('Error updating aggregate stats:', error);
    }
  }

  // Leaderboards
  async getGlobalLeaderboard(gameId: string, statType: string, limit = 100): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('user_game_stats')
        .select(`
          *,
          user:profiles!user_id(id, username, display_name, avatar_url),
          game:games!game_id(id, name, cover_url)
        `)
        .eq('game_id', gameId)
        .order(statType, { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data?.map((entry, index) => ({
        ...entry,
        rank: index + 1
      })) || [];
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }
  }

  // Account Management
  async getConnectedAccounts(userId: string): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('user_game_accounts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching connected accounts:', error);
      return [];
    }
  }

  async disconnectAccount(userId: string, platform: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('user_game_accounts')
        .update({ is_active: false, disconnected_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('platform', platform);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error disconnecting account:', error);
      return false;
    }
  }

  // Sync Functions
  async syncAllUserData(userId: string): Promise<void> {
    try {
      const accounts = await this.getConnectedAccounts(userId);
      
      for (const account of accounts) {
        switch (account.platform) {
          case 'steam':
            await this.syncSteamData(userId, account.platform_user_id);
            break;
          case 'epic':
            // await this.syncEpicData(userId, account);
            break;
          case 'xbox':
            // await this.syncXboxData(userId, account);
            break;
        }
      }
    } catch (error) {
      console.error('Error syncing user data:', error);
    }
  }

  async syncSteamData(userId: string, steamId: string): Promise<void> {
    try {
      // Sync recent games and achievements
      const recentGames = await this.getSteamRecentGames(steamId);
      
      for (const game of recentGames) {
        const { data: gameData } = await this.supabase
          .from('games')
          .select('id')
          .eq('steam_app_id', game.appid)
          .single();

        if (gameData) {
          // Update playtime and last played
          await this.supabase
            .from('user_game_stats')
            .upsert({
              user_id: userId,
              game_id: gameData.id,
              platform: 'steam',
              total_playtime: game.playtime_forever,
              last_played: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          // Sync achievements
          const achievements = await this.getSteamAchievements(steamId, game.appid);
          const unlockedAchievements = achievements.filter(a => a.achieved === 1);
          
          await this.supabase
            .from('user_game_stats')
            .update({
              achievements_unlocked: unlockedAchievements.length,
              total_achievements: achievements.length
            })
            .eq('user_id', userId)
            .eq('game_id', gameData.id);
        }
      }
    } catch (error) {
      console.error('Error syncing Steam data:', error);
    }
  }

  // Riot Games Integration
  async connectRiotAccount(userId: string, riotId: string, tagLine: string, region: string = 'na1'): Promise<boolean> {
    try {
      const account = await this.getRiotAccount(riotId, tagLine, region);
      if (!account) {
        throw new Error('Riot account not found');
      }

      const { error } = await this.supabase
        .from('user_game_accounts')
        .upsert({
          user_id: userId,
          platform: 'riot',
          platform_user_id: account.puuid,
          platform_username: `${account.gameName}#${account.tagLine}`,
          profile_data: account,
          connected_at: new Date().toISOString(),
          is_active: true
        });

      if (error) throw error;

      // Import Valorant and League data
      await this.syncValorantData(userId, account.puuid, region);
      
      return true;
    } catch (error) {
      console.error('Error connecting Riot account:', error);
      return false;
    }
  }

  async getRiotAccount(gameName: string, tagLine: string, region: string = 'americas'): Promise<RiotAccount | null> {
    try {
      const response = await fetch(
        `https://${region}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}?api_key=${this.riotApiKey}`
      );

      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error fetching Riot account:', error);
      return null;
    }
  }

  async getValorantMatches(puuid: string, region: string = 'na1', count: number = 20): Promise<string[]> {
    try {
      const response = await fetch(
        `https://${region}.api.riotgames.com/val/match/v1/matchlists/by-puuid/${puuid}?api_key=${this.riotApiKey}`
      );

      if (!response.ok) return [];
      
      const data = await response.json();
      return data.history?.slice(0, count).map((match: any) => match.matchId) || [];
    } catch (error) {
      console.error('Error fetching Valorant matches:', error);
      return [];
    }
  }

  async getValorantMatchDetails(matchId: string, region: string = 'na1'): Promise<ValorantMatch | null> {
    try {
      const response = await fetch(
        `https://${region}.api.riotgames.com/val/match/v1/matches/${matchId}?api_key=${this.riotApiKey}`
      );

      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error fetching Valorant match details:', error);
      return null;
    }
  }

  async getValorantCompetitiveUpdates(puuid: string, region: string = 'na1'): Promise<CompetitiveRank[]> {
    try {
      const response = await fetch(
        `https://${region}.api.riotgames.com/val/ranked/v1/leaderboards/by-act/e2d07cce-43ca-5013-92b6-6931c438dc10?api_key=${this.riotApiKey}`
      );

      if (!response.ok) return [];
      
      const data = await response.json();
      return data.players || [];
    } catch (error) {
      console.error('Error fetching Valorant competitive updates:', error);
      return [];
    }
  }

  private async syncValorantData(userId: string, puuid: string, region: string): Promise<void> {
    try {
      const matchIds = await this.getValorantMatches(puuid, region, 10);
      
      for (const matchId of matchIds) {
        const matchDetails = await this.getValorantMatchDetails(matchId, region);
        if (!matchDetails) continue;

        const player = matchDetails.players.find(p => p.puuid === puuid);
        if (!player) continue;

        // Record match in database
        await this.recordMatch(userId, {
          match_id: matchId,
          game_id: 'valorant',
          platform: 'riot',
          date_played: new Date(matchDetails.matchInfo.gameStartMillis).toISOString(),
          duration: matchDetails.matchInfo.gameLengthMillis / 1000,
          result: matchDetails.teams.find(t => t.teamId === player.teamId)?.won ? 'win' : 'loss',
          kills: player.stats.kills,
          deaths: player.stats.deaths,
          assists: player.stats.assists,
          game_mode: matchDetails.matchInfo.gameMode,
          map: matchDetails.matchInfo.mapId,
          score: `${player.stats.kills}/${player.stats.deaths}/${player.stats.assists}`
        });
      }

      // Update competitive rank
      const competitiveUpdates = await this.getValorantCompetitiveUpdates(puuid, region);
      // Process and update rank data
    } catch (error) {
      console.error('Error syncing Valorant data:', error);
    }
  }

  // Blizzard Battle.net Integration
  async connectBlizzardAccount(userId: string, authCode: string): Promise<boolean> {
    try {
      const tokenResponse = await fetch('https://oauth.battle.net/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: authCode,
          client_id: this.blizzardClientId,
          client_secret: this.blizzardClientSecret,
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to exchange Blizzard auth code');
      }

      const tokens = await tokenResponse.json();
      const profile = await this.getBlizzardProfile(tokens.access_token);
      
      if (!profile) {
        throw new Error('Failed to get Blizzard profile');
      }

      const { error } = await this.supabase
        .from('user_game_accounts')
        .upsert({
          user_id: userId,
          platform: 'battle_net',
          platform_user_id: profile.id.toString(),
          platform_username: profile.battletag,
          profile_data: profile,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
          connected_at: new Date().toISOString(),
          is_active: true
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error connecting Blizzard account:', error);
      return false;
    }
  }

  private async getBlizzardProfile(accessToken: string): Promise<BlizzardProfile | null> {
    try {
      const response = await fetch('https://oauth.battle.net/userinfo', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error fetching Blizzard profile:', error);
      return null;
    }
  }

  async getOverwatchStats(battletag: string, platform: string = 'pc', region: string = 'us'): Promise<OverwatchStats | null> {
    try {
      // Note: This would require Blizzard API access or third-party API
      // Placeholder implementation
      const mockStats: OverwatchStats = {
        competitiveStats: {
          careerStats: {},
          games: { won: 0, played: 0 }
        },
        quickPlayStats: {
          careerStats: {},
          games: { won: 0, played: 0 }
        }
      };
      return mockStats;
    } catch (error) {
      console.error('Error fetching Overwatch stats:', error);
      return null;
    }
  }

  // Enhanced Analytics
  async getCrossGameSkillCorrelation(userId: string): Promise<any> {
    try {
      const { data: userStats } = await this.supabase
        .from('user_game_stats')
        .select(`
          *,
          game:games(name, genre, type)
        `)
        .eq('user_id', userId);

      if (!userStats) return null;

      // Calculate correlations between different game performance metrics
      const correlations = this.calculateSkillCorrelations(userStats);
      return correlations;
    } catch (error) {
      console.error('Error calculating cross-game correlations:', error);
      return null;
    }
  }

  private calculateSkillCorrelations(stats: any[]): any {
    const correlations: any = {};
    
    // Group by game genres/types
    const aimBasedGames = stats.filter(s => ['fps', 'tactical-shooter'].includes(s.game?.genre));
    const strategyGames = stats.filter(s => ['moba', 'rts'].includes(s.game?.genre));
    
    if (aimBasedGames.length >= 2) {
      const aimCorrelation = this.correlateMetrics(
        aimBasedGames,
        ['kd_ratio', 'headshot_percentage', 'adr']
      );
      correlations.aim_skills = aimCorrelation;
    }

    if (strategyGames.length >= 2) {
      const strategyCorrelation = this.correlateMetrics(
        strategyGames,
        ['win_rate', 'kd_ratio', 'assists']
      );
      correlations.strategic_skills = strategyCorrelation;
    }

    return correlations;
  }

  private correlateMetrics(games: any[], metrics: string[]): number {
    // Simplified correlation calculation
    if (games.length < 2) return 0;
    
    let totalCorrelation = 0;
    let validComparisons = 0;
    
    for (let i = 0; i < games.length - 1; i++) {
      for (let j = i + 1; j < games.length; j++) {
        for (const metric of metrics) {
          if (games[i][metric] && games[j][metric]) {
            const normalized1 = this.normalizeMetric(games[i][metric], metric);
            const normalized2 = this.normalizeMetric(games[j][metric], metric);
            totalCorrelation += Math.abs(normalized1 - normalized2);
            validComparisons++;
          }
        }
      }
    }
    
    return validComparisons > 0 ? 1 - (totalCorrelation / validComparisons) : 0;
  }

  private normalizeMetric(value: number, metric: string): number {
    // Normalize different metrics to 0-1 scale
    const maxValues = {
      kd_ratio: 3.0,
      win_rate: 100,
      headshot_percentage: 100,
      adr: 200
    };
    
    const max = maxValues[metric as keyof typeof maxValues] || 100;
    return Math.min(value / max, 1);
  }

  // PlayStation Network Integration
  async connectPSNAccount(userId: string, authCode: string): Promise<boolean> {
    try {
      const tokenResponse = await fetch('https://ca.account.sony.com/api/authz/v3/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: authCode,
          client_id: this.psnClientId,
          client_secret: this.psnClientSecret,
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to exchange PSN auth code');
      }

      const tokens = await tokenResponse.json();
      const profile = await this.getPSNProfile(tokens.access_token);
      
      if (!profile) {
        throw new Error('Failed to get PSN profile');
      }

      const { error } = await this.supabase
        .from('user_game_accounts')
        .upsert({
          user_id: userId,
          platform: 'playstation',
          platform_user_id: profile.accountId,
          platform_username: profile.onlineId,
          profile_data: profile,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
          connected_at: new Date().toISOString(),
          is_active: true
        });

      if (error) throw error;

      // Import PSN games and trophies
      await this.importPSNGames(userId, tokens.access_token, profile.accountId);
      
      return true;
    } catch (error) {
      console.error('Error connecting PSN account:', error);
      return false;
    }
  }

  private async getPSNProfile(accessToken: string): Promise<PSNProfile | null> {
    try {
      const response = await fetch('https://us-prof.np.community.playstation.net/userProfile/v1/users/me/profile2', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error fetching PSN profile:', error);
      return null;
    }
  }

  private async importPSNGames(userId: string, accessToken: string, accountId: string): Promise<void> {
    try {
      const games = await this.getPSNGames(accessToken, accountId);
      
      for (const game of games) {
        let { data: existingGame } = await this.supabase
          .from('games')
          .select('id')
          .eq('psn_communication_id', game.npCommunicationId)
          .single();

        if (!existingGame) {
          const { data: newGame } = await this.supabase
            .from('games')
            .insert({
              name: game.trophyTitleName,
              psn_communication_id: game.npCommunicationId,
              cover_url: game.trophyTitleIconUrl,
              platform: 'playstation'
            })
            .select('id')
            .single();

          existingGame = newGame;
        }

        if (existingGame) {
          await this.supabase
            .from('user_game_stats')
            .upsert({
              user_id: userId,
              game_id: existingGame.id,
              platform: 'playstation',
              achievements_unlocked: game.earnedTrophies.platinum + game.earnedTrophies.gold + 
                                   game.earnedTrophies.silver + game.earnedTrophies.bronze,
              total_achievements: game.definedTrophies.platinum + game.definedTrophies.gold + 
                                game.definedTrophies.silver + game.definedTrophies.bronze,
              last_played: game.lastUpdatedDateTime,
              updated_at: new Date().toISOString()
            });
        }
      }
    } catch (error) {
      console.error('Error importing PSN games:', error);
    }
  }

  private async getPSNGames(accessToken: string, accountId: string): Promise<PSNGame[]> {
    try {
      const response = await fetch(`https://us-tpy.np.community.playstation.net/trophy/v1/users/${accountId}/trophyTitles`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) return [];
      
      const data = await response.json();
      return data.trophyTitles || [];
    } catch (error) {
      console.error('Error fetching PSN games:', error);
      return [];
    }
  }

  // Nintendo Switch Integration
  async connectNintendoAccount(userId: string, sessionToken: string): Promise<boolean> {
    try {
      const profile = await this.getNintendoProfile(sessionToken);
      if (!profile) {
        throw new Error('Failed to get Nintendo profile');
      }

      const { error } = await this.supabase
        .from('user_game_accounts')
        .upsert({
          user_id: userId,
          platform: 'nintendo',
          platform_user_id: profile.id,
          platform_username: profile.name,
          profile_data: profile,
          access_token: sessionToken,
          connected_at: new Date().toISOString(),
          is_active: true
        });

      if (error) throw error;

      // Import Nintendo games
      await this.importNintendoGames(userId, sessionToken, profile.id);
      
      return true;
    } catch (error) {
      console.error('Error connecting Nintendo account:', error);
      return false;
    }
  }

  private async getNintendoProfile(sessionToken: string): Promise<NintendoProfile | null> {
    try {
      // Nintendo's API requires complex authentication flow
      // This is a simplified implementation
      const response = await fetch('https://api-lp1.znc.srv.nintendo.net/v3/User/ShowSelf', {
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
        },
      });

      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error fetching Nintendo profile:', error);
      return null;
    }
  }

  private async importNintendoGames(userId: string, sessionToken: string, profileId: string): Promise<void> {
    try {
      const games = await this.getNintendoGames(sessionToken, profileId);
      
      for (const game of games) {
        let { data: existingGame } = await this.supabase
          .from('games')
          .select('id')
          .eq('nintendo_app_id', game.applicationId)
          .single();

        if (!existingGame) {
          const { data: newGame } = await this.supabase
            .from('games')
            .insert({
              name: game.name,
              nintendo_app_id: game.applicationId,
              cover_url: game.imageUri,
              platform: 'nintendo'
            })
            .select('id')
            .single();

          existingGame = newGame;
        }

        if (existingGame) {
          await this.supabase
            .from('user_game_stats')
            .upsert({
              user_id: userId,
              game_id: existingGame.id,
              platform: 'nintendo',
              total_playtime: game.totalPlayTime,
              last_played: game.lastPlayedAt,
              updated_at: new Date().toISOString()
            });
        }
      }
    } catch (error) {
      console.error('Error importing Nintendo games:', error);
    }
  }

  private async getNintendoGames(sessionToken: string, profileId: string): Promise<NintendoGame[]> {
    try {
      const response = await fetch(`https://api-lp1.znc.srv.nintendo.net/v3/Game/ListByUser?userId=${profileId}`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
        },
      });

      if (!response.ok) return [];
      
      const data = await response.json();
      return data.games || [];
    } catch (error) {
      console.error('Error fetching Nintendo games:', error);
      return [];
    }
  }

  // GOG Galaxy Integration
  async connectGOGAccount(userId: string, authCode: string): Promise<boolean> {
    try {
      const tokenResponse = await fetch('https://auth.gog.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: authCode,
          client_id: this.gogClientId,
          client_secret: this.gogClientSecret,
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to exchange GOG auth code');
      }

      const tokens = await tokenResponse.json();
      const profile = await this.getGOGProfile(tokens.access_token);
      
      if (!profile) {
        throw new Error('Failed to get GOG profile');
      }

      const { error } = await this.supabase
        .from('user_game_accounts')
        .upsert({
          user_id: userId,
          platform: 'gog',
          platform_user_id: profile.userId,
          platform_username: profile.username,
          profile_data: profile,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
          connected_at: new Date().toISOString(),
          is_active: true
        });

      if (error) throw error;

      // Import GOG games
      await this.importGOGGames(userId, tokens.access_token);
      
      return true;
    } catch (error) {
      console.error('Error connecting GOG account:', error);
      return false;
    }
  }

  private async getGOGProfile(accessToken: string): Promise<GOGProfile | null> {
    try {
      const response = await fetch('https://embed.gog.com/userData.json', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error fetching GOG profile:', error);
      return null;
    }
  }

  private async importGOGGames(userId: string, accessToken: string): Promise<void> {
    try {
      const games = await this.getGOGGames(accessToken);
      
      for (const game of games) {
        let { data: existingGame } = await this.supabase
          .from('games')
          .select('id')
          .eq('gog_id', game.id)
          .single();

        if (!existingGame) {
          const { data: newGame } = await this.supabase
            .from('games')
            .insert({
              name: game.title,
              gog_id: game.id,
              platform: 'gog'
            })
            .select('id')
            .single();

          existingGame = newGame;
        }

        if (existingGame) {
          await this.supabase
            .from('user_game_stats')
            .upsert({
              user_id: userId,
              game_id: existingGame.id,
              platform: 'gog',
              total_playtime: game.gameTime || 0,
              last_played: game.lastPlayed ? new Date(game.lastPlayed * 1000).toISOString() : null,
              updated_at: new Date().toISOString()
            });
        }
      }
    } catch (error) {
      console.error('Error importing GOG games:', error);
    }
  }

  private async getGOGGames(accessToken: string): Promise<GOGGame[]> {
    try {
      const response = await fetch('https://embed.gog.com/account/getFilteredProducts', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) return [];
      
      const data = await response.json();
      return data.products || [];
    } catch (error) {
      console.error('Error fetching GOG games:', error);
      return [];
    }
  }
}

export const gameAPIManager = new GameAPIManager();
