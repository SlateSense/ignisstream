import { WebSocketServer, WebSocket } from 'ws';
import { createClient } from '@supabase/supabase-js';
import { LiveMatchUpdate, WebSocketMessage } from '../gaming/game-api-manager';

interface ClientConnection {
  ws: WebSocket;
  userId: string;
  gameId?: string;
  tournamentId?: string;
  isAlive: boolean;
}

export class GameWebSocketServer {
  private wss: WebSocketServer;
  private clients: Map<string, ClientConnection> = new Map();
  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
  private heartbeatInterval: NodeJS.Timeout;

  constructor(port: number = 3001) {
    this.wss = new WebSocketServer({ port });
    this.setupServer();
    this.startHeartbeat();
    console.log(`GameWebSocketServer started on port ${port}`);
  }

  private setupServer(): void {
    this.wss.on('connection', (ws: WebSocket, request) => {
      const url = new URL(request.url || '', `http://${request.headers.host}`);
      const userId = url.pathname.split('/')[2]; // Extract from /ws/:userId

      if (!userId) {
        ws.close(4000, 'Invalid user ID');
        return;
      }

      const clientId = `${userId}-${Date.now()}`;
      const client: ClientConnection = {
        ws,
        userId,
        isAlive: true
      };

      this.clients.set(clientId, client);
      
      // Send welcome message
      this.sendMessage(clientId, {
        type: 'connection_established',
        payload: { message: 'Connected to IgnisStream real-time updates' },
        timestamp: new Date().toISOString()
      });

      // Handle incoming messages
      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleClientMessage(clientId, message);
        } catch (error) {
          console.error('Invalid message format:', error);
        }
      });

      // Handle connection close
      ws.on('close', () => {
        this.clients.delete(clientId);
        console.log(`Client disconnected: ${userId}`);
      });

      // Handle pong responses for heartbeat
      ws.on('pong', () => {
        client.isAlive = true;
      });

      console.log(`Client connected: ${userId}`);
    });
  }

  private handleClientMessage(clientId: string, message: any): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    switch (message.type) {
      case 'join_game':
        client.gameId = message.gameId;
        this.broadcastToGame(message.gameId, {
          type: 'player_joined',
          payload: { userId: client.userId },
          timestamp: new Date().toISOString()
        }, clientId);
        break;

      case 'leave_game':
        if (client.gameId) {
          this.broadcastToGame(client.gameId, {
            type: 'player_left',
            payload: { userId: client.userId },
            timestamp: new Date().toISOString()
          }, clientId);
        }
        client.gameId = undefined;
        break;

      case 'join_tournament':
        client.tournamentId = message.tournamentId;
        this.broadcastToTournament(message.tournamentId, {
          type: 'participant_joined',
          payload: { userId: client.userId },
          timestamp: new Date().toISOString()
        }, clientId);
        break;

      case 'match_update':
        this.handleMatchUpdate(client, message.payload);
        break;

      case 'tournament_action':
        this.handleTournamentAction(client, message.payload);
        break;

      case 'friend_activity':
        this.handleFriendActivity(client, message.payload);
        break;
    }
  }

  private async handleMatchUpdate(client: ClientConnection, update: LiveMatchUpdate): Promise<void> {
    try {
      // Store update in database
      await this.supabase
        .from('live_match_updates')
        .insert({
          match_id: update.matchId,
          game_id: update.gameId,
          user_id: client.userId,
          type: update.type,
          data: update.data,
          timestamp: update.timestamp
        });

      // Broadcast to all clients watching this match
      this.broadcastToMatch(update.matchId, {
        type: 'match_update',
        payload: update,
        timestamp: new Date().toISOString()
      });

      // Broadcast to friends
      await this.broadcastToFriends(client.userId, {
        type: 'friend_match_update',
        payload: {
          userId: client.userId,
          update
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error handling match update:', error);
    }
  }

  private async handleTournamentAction(client: ClientConnection, action: any): Promise<void> {
    if (!client.tournamentId) return;

    try {
      switch (action.type) {
        case 'match_result':
          await this.supabase
            .from('tournament_matches')
            .update({
              winner_id: action.winnerId,
              score: action.score,
              completed_time: new Date().toISOString(),
              status: 'completed'
            })
            .eq('id', action.matchId);

          this.broadcastToTournament(client.tournamentId, {
            type: 'match_completed',
            payload: action,
            timestamp: new Date().toISOString()
          });
          break;

        case 'round_advance':
          this.broadcastToTournament(client.tournamentId, {
            type: 'round_advanced',
            payload: action,
            timestamp: new Date().toISOString()
          });
          break;
      }
    } catch (error) {
      console.error('Error handling tournament action:', error);
    }
  }

  private async handleFriendActivity(client: ClientConnection, activity: any): Promise<void> {
    try {
      // Broadcast activity to friends
      await this.broadcastToFriends(client.userId, {
        type: 'friend_activity',
        payload: {
          userId: client.userId,
          activity
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error handling friend activity:', error);
    }
  }

  private sendMessage(clientId: string, message: WebSocketMessage): void {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  }

  private broadcastToGame(gameId: string, message: WebSocketMessage, excludeClientId?: string): void {
    this.clients.forEach((client, clientId) => {
      if (client.gameId === gameId && clientId !== excludeClientId) {
        this.sendMessage(clientId, message);
      }
    });
  }

  private broadcastToMatch(matchId: string, message: WebSocketMessage): void {
    // For now, broadcast to all connected clients
    // In production, you'd maintain match subscriptions
    this.clients.forEach((client, clientId) => {
      this.sendMessage(clientId, message);
    });
  }

  private broadcastToTournament(tournamentId: string, message: WebSocketMessage, excludeClientId?: string): void {
    this.clients.forEach((client, clientId) => {
      if (client.tournamentId === tournamentId && clientId !== excludeClientId) {
        this.sendMessage(clientId, message);
      }
    });
  }

  private async broadcastToFriends(userId: string, message: WebSocketMessage): Promise<void> {
    try {
      // Get user's friends
      const { data: friends } = await this.supabase
        .from('friends')
        .select('friend_id')
        .eq('user_id', userId)
        .eq('status', 'accepted');

      if (!friends) return;

      // Broadcast to online friends
      const friendIds = friends.map(f => f.friend_id);
      this.clients.forEach((client, clientId) => {
        if (friendIds.includes(client.userId)) {
          this.sendMessage(clientId, message);
        }
      });
    } catch (error) {
      console.error('Error broadcasting to friends:', error);
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.clients.forEach((client, clientId) => {
        if (!client.isAlive) {
          client.ws.terminate();
          this.clients.delete(clientId);
          return;
        }

        client.isAlive = false;
        client.ws.ping();
      });
    }, 30000); // 30 seconds
  }

  // Public methods for external triggers

  public async notifyAchievementUnlock(userId: string, achievement: any): Promise<void> {
    // Find user's connections
    const userClients = Array.from(this.clients.entries())
      .filter(([, client]) => client.userId === userId);

    userClients.forEach(([clientId]) => {
      this.sendMessage(clientId, {
        type: 'achievement_unlocked',
        payload: achievement,
        timestamp: new Date().toISOString()
      });
    });

    // Notify friends
    await this.broadcastToFriends(userId, {
      type: 'friend_achievement_unlocked',
      payload: {
        userId,
        achievement
      },
      timestamp: new Date().toISOString()
    });
  }

  public async notifySkillPredictionUpdate(userId: string, prediction: any): Promise<void> {
    const userClients = Array.from(this.clients.entries())
      .filter(([, client]) => client.userId === userId);

    userClients.forEach(([clientId]) => {
      this.sendMessage(clientId, {
        type: 'skill_prediction_updated',
        payload: prediction,
        timestamp: new Date().toISOString()
      });
    });
  }

  public async notifyTournamentUpdate(tournamentId: string, update: any): Promise<void> {
    this.broadcastToTournament(tournamentId, {
      type: 'tournament_update',
      payload: update,
      timestamp: new Date().toISOString()
    });
  }

  public async notifyFriendOnline(userId: string, friendId: string): Promise<void> {
    // Notify the user that their friend came online
    const userClients = Array.from(this.clients.entries())
      .filter(([, client]) => client.userId === userId);

    userClients.forEach(([clientId]) => {
      this.sendMessage(clientId, {
        type: 'friend_online',
        payload: { friendId },
        timestamp: new Date().toISOString()
      });
    });

    // Notify the friend that user is online
    const friendClients = Array.from(this.clients.entries())
      .filter(([, client]) => client.userId === friendId);

    friendClients.forEach(([clientId]) => {
      this.sendMessage(clientId, {
        type: 'friend_online',
        payload: { friendId: userId },
        timestamp: new Date().toISOString()
      });
    });
  }

  public getStats(): { totalConnections: number; activeGames: Set<string>; activeTournaments: Set<string> } {
    const activeGames = new Set<string>();
    const activeTournaments = new Set<string>();

    this.clients.forEach(client => {
      if (client.gameId) activeGames.add(client.gameId);
      if (client.tournamentId) activeTournaments.add(client.tournamentId);
    });

    return {
      totalConnections: this.clients.size,
      activeGames,
      activeTournaments
    };
  }

  public close(): void {
    clearInterval(this.heartbeatInterval);
    this.wss.close();
  }
}

// Initialize server if running as main module
if (require.main === module) {
  const port = parseInt(process.env.WS_PORT || '3001');
  new GameWebSocketServer(port);
}
