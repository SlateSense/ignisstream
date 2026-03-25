/**
 * Enterprise WebSocket Connection Pool for IgnisStream
 * Handles massive concurrent connections with intelligent load balancing
 */

import { EventEmitter } from 'events';
import WebSocket from 'ws';
import { createClient } from 'redis';

interface ConnectionMetrics {
  connectionId: string;
  userId?: string;
  connectedAt: Date;
  lastActivity: Date;
  messagesSent: number;
  messagesReceived: number;
  roomsSubscribed: string[];
  bandwidth: number;
  latency: number;
}

interface Room {
  id: string;
  connections: Set<string>;
  metadata: {
    type: 'stream' | 'tournament' | 'match' | 'general';
    capacity: number;
    createdAt: Date;
    lastActivity: Date;
  };
}

interface PoolConfig {
  maxConnections: number;
  maxConnectionsPerUser: number;
  heartbeatInterval: number;
  idleTimeout: number;
  messageRateLimit: number;
  enableClustering: boolean;
  redisConfig?: {
    host: string;
    port: number;
    password?: string;
  };
}

export class WebSocketConnectionPool extends EventEmitter {
  private connections: Map<string, WebSocket> = new Map();
  private connectionMetrics: Map<string, ConnectionMetrics> = new Map();
  private userConnections: Map<string, Set<string>> = new Map();
  private rooms: Map<string, Room> = new Map();
  private config: PoolConfig;
  private heartbeatTimer?: NodeJS.Timer;
  private cleanupTimer?: NodeJS.Timer;
  private redisClient?: any;
  private clusterId: string;

  constructor(config: PoolConfig) {
    super();
    this.config = config;
    this.clusterId = `ignis-ws-${Math.random().toString(36).substr(2, 9)}`;
    this.initializeRedis();
    this.startHeartbeat();
    this.startCleanup();
  }

  private async initializeRedis() {
    if (!this.config.enableClustering || !this.config.redisConfig) return;

    try {
      this.redisClient = createClient({
        socket: {
          host: this.config.redisConfig.host,
          port: this.config.redisConfig.port,
        },
        password: this.config.redisConfig.password,
      });

      await this.redisClient.connect();
      
      // Subscribe to cluster messages
      const subscriber = this.redisClient.duplicate();
      await subscriber.connect();
      
      await subscriber.subscribe('ignis:ws:broadcast', (message) => {
        this.handleClusterMessage(JSON.parse(message));
      });

      console.log(`WebSocket cluster node ${this.clusterId} connected to Redis`);
    } catch (error) {
      console.error('Failed to initialize Redis for WebSocket clustering:', error);
    }
  }

  // Add new WebSocket connection to pool
  addConnection(ws: WebSocket, userId?: string, metadata?: any): string {
    const connectionId = this.generateConnectionId();

    // Check connection limits
    if (this.connections.size >= this.config.maxConnections) {
      ws.close(1013, 'Server overloaded');
      throw new Error('Connection pool at capacity');
    }

    if (userId) {
      const userConnectionCount = this.userConnections.get(userId)?.size || 0;
      if (userConnectionCount >= this.config.maxConnectionsPerUser) {
        ws.close(1013, 'Too many connections for user');
        throw new Error('User connection limit exceeded');
      }
    }

    // Store connection
    this.connections.set(connectionId, ws);
    
    // Initialize metrics
    this.connectionMetrics.set(connectionId, {
      connectionId,
      userId,
      connectedAt: new Date(),
      lastActivity: new Date(),
      messagesSent: 0,
      messagesReceived: 0,
      roomsSubscribed: [],
      bandwidth: 0,
      latency: 0,
    });

    // Track user connections
    if (userId) {
      if (!this.userConnections.has(userId)) {
        this.userConnections.set(userId, new Set());
      }
      this.userConnections.get(userId)!.add(connectionId);
    }

    // Setup connection handlers
    this.setupConnectionHandlers(connectionId, ws);

    // Emit connection event
    this.emit('connection', { connectionId, userId, metadata });

    console.log(`Connection ${connectionId} added. Pool size: ${this.connections.size}`);
    return connectionId;
  }

  private setupConnectionHandlers(connectionId: string, ws: WebSocket) {
    ws.on('message', (data) => {
      this.handleMessage(connectionId, data);
    });

    ws.on('close', () => {
      this.removeConnection(connectionId);
    });

    ws.on('error', (error) => {
      console.error(`WebSocket error for ${connectionId}:`, error);
      this.removeConnection(connectionId);
    });

    ws.on('pong', () => {
      const metrics = this.connectionMetrics.get(connectionId);
      if (metrics) {
        metrics.lastActivity = new Date();
        metrics.latency = Date.now() - metrics.lastActivity.getTime();
      }
    });
  }

  private handleMessage(connectionId: string, data: any) {
    const metrics = this.connectionMetrics.get(connectionId);
    if (!metrics) return;

    try {
      const message = JSON.parse(data.toString());
      
      // Rate limiting
      const now = Date.now();
      const timeSinceLastMessage = now - metrics.lastActivity.getTime();
      
      if (timeSinceLastMessage < (1000 / this.config.messageRateLimit)) {
        this.sendToConnection(connectionId, {
          type: 'error',
          message: 'Rate limit exceeded',
        });
        return;
      }

      // Update metrics
      metrics.messagesReceived++;
      metrics.lastActivity = new Date();
      metrics.bandwidth += data.length;

      // Handle different message types
      switch (message.type) {
        case 'join_room':
          this.handleJoinRoom(connectionId, message.roomId);
          break;
        case 'leave_room':
          this.handleLeaveRoom(connectionId, message.roomId);
          break;
        case 'room_message':
          this.handleRoomMessage(connectionId, message);
          break;
        case 'ping':
          this.sendToConnection(connectionId, { type: 'pong', timestamp: Date.now() });
          break;
        default:
          this.emit('message', { connectionId, message });
      }
    } catch (error) {
      console.error(`Failed to handle message from ${connectionId}:`, error);
    }
  }

  // Room management
  private handleJoinRoom(connectionId: string, roomId: string) {
    if (!this.rooms.has(roomId)) {
      this.createRoom(roomId, { type: 'general', capacity: 1000 });
    }

    const room = this.rooms.get(roomId)!;
    const metrics = this.connectionMetrics.get(connectionId);

    if (!metrics) return;

    // Check room capacity
    if (room.connections.size >= room.metadata.capacity) {
      this.sendToConnection(connectionId, {
        type: 'error',
        message: 'Room is at capacity',
      });
      return;
    }

    // Add to room
    room.connections.add(connectionId);
    metrics.roomsSubscribed.push(roomId);
    room.metadata.lastActivity = new Date();

    // Notify cluster if enabled
    if (this.config.enableClustering) {
      this.broadcastToCluster({
        type: 'user_joined_room',
        roomId,
        userId: metrics.userId,
        clusterId: this.clusterId,
      });
    }

    this.sendToConnection(connectionId, {
      type: 'room_joined',
      roomId,
      memberCount: room.connections.size,
    });

    // Notify other room members
    this.broadcastToRoom(roomId, {
      type: 'user_joined',
      userId: metrics.userId,
      memberCount: room.connections.size,
    }, connectionId);
  }

  private handleLeaveRoom(connectionId: string, roomId: string) {
    const room = this.rooms.get(roomId);
    const metrics = this.connectionMetrics.get(connectionId);

    if (!room || !metrics) return;

    room.connections.delete(connectionId);
    metrics.roomsSubscribed = metrics.roomsSubscribed.filter(id => id !== roomId);

    // Clean up empty rooms
    if (room.connections.size === 0) {
      this.rooms.delete(roomId);
    } else {
      // Notify remaining members
      this.broadcastToRoom(roomId, {
        type: 'user_left',
        userId: metrics.userId,
        memberCount: room.connections.size,
      });
    }

    this.sendToConnection(connectionId, {
      type: 'room_left',
      roomId,
    });
  }

  private handleRoomMessage(connectionId: string, message: any) {
    const metrics = this.connectionMetrics.get(connectionId);
    if (!metrics || !message.roomId) return;

    // Validate user is in room
    const room = this.rooms.get(message.roomId);
    if (!room || !room.connections.has(connectionId)) {
      this.sendToConnection(connectionId, {
        type: 'error',
        message: 'Not a member of this room',
      });
      return;
    }

    // Broadcast to room
    this.broadcastToRoom(message.roomId, {
      type: 'room_message',
      roomId: message.roomId,
      userId: metrics.userId,
      content: message.content,
      timestamp: Date.now(),
    }, connectionId);

    // Broadcast to cluster
    if (this.config.enableClustering) {
      this.broadcastToCluster({
        type: 'room_message',
        roomId: message.roomId,
        userId: metrics.userId,
        content: message.content,
        timestamp: Date.now(),
        excludeCluster: this.clusterId,
      });
    }
  }

  private createRoom(roomId: string, options: Partial<Room['metadata']> = {}) {
    const room: Room = {
      id: roomId,
      connections: new Set(),
      metadata: {
        type: options.type || 'general',
        capacity: options.capacity || 1000,
        createdAt: new Date(),
        lastActivity: new Date(),
      },
    };

    this.rooms.set(roomId, room);
    this.emit('room_created', { roomId, room });
  }

  // Broadcasting methods
  broadcastToRoom(roomId: string, message: any, excludeConnectionId?: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    let sentCount = 0;
    for (const connectionId of room.connections) {
      if (connectionId === excludeConnectionId) continue;
      
      if (this.sendToConnection(connectionId, message)) {
        sentCount++;
      }
    }

    return sentCount;
  }

  broadcastToUser(userId: string, message: any) {
    const userConnections = this.userConnections.get(userId);
    if (!userConnections) return 0;

    let sentCount = 0;
    for (const connectionId of userConnections) {
      if (this.sendToConnection(connectionId, message)) {
        sentCount++;
      }
    }

    return sentCount;
  }

  broadcastToAll(message: any, excludeConnectionId?: string) {
    let sentCount = 0;
    for (const [connectionId, ws] of this.connections) {
      if (connectionId === excludeConnectionId) continue;
      
      if (this.sendToConnection(connectionId, message)) {
        sentCount++;
      }
    }

    return sentCount;
  }

  private async broadcastToCluster(message: any) {
    if (!this.redisClient) return;

    try {
      await this.redisClient.publish('ignis:ws:broadcast', JSON.stringify({
        ...message,
        sourceCluster: this.clusterId,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.error('Failed to broadcast to cluster:', error);
    }
  }

  private handleClusterMessage(message: any) {
    // Don't handle messages from our own cluster
    if (message.sourceCluster === this.clusterId) return;

    switch (message.type) {
      case 'room_message':
        if (message.excludeCluster !== this.clusterId) {
          this.broadcastToRoom(message.roomId, {
            type: 'room_message',
            roomId: message.roomId,
            userId: message.userId,
            content: message.content,
            timestamp: message.timestamp,
          });
        }
        break;
      
      case 'user_joined_room':
        // Update local room state if needed
        break;
    }
  }

  sendToConnection(connectionId: string, message: any): boolean {
    const ws = this.connections.get(connectionId);
    const metrics = this.connectionMetrics.get(connectionId);

    if (!ws || ws.readyState !== WebSocket.OPEN) {
      this.removeConnection(connectionId);
      return false;
    }

    try {
      const data = JSON.stringify(message);
      ws.send(data);
      
      if (metrics) {
        metrics.messagesSent++;
        metrics.bandwidth += data.length;
      }
      
      return true;
    } catch (error) {
      console.error(`Failed to send message to ${connectionId}:`, error);
      this.removeConnection(connectionId);
      return false;
    }
  }

  removeConnection(connectionId: string) {
    const ws = this.connections.get(connectionId);
    const metrics = this.connectionMetrics.get(connectionId);

    if (ws) {
      ws.terminate();
      this.connections.delete(connectionId);
    }

    if (metrics) {
      // Remove from user connections
      if (metrics.userId) {
        const userConnections = this.userConnections.get(metrics.userId);
        if (userConnections) {
          userConnections.delete(connectionId);
          if (userConnections.size === 0) {
            this.userConnections.delete(metrics.userId);
          }
        }
      }

      // Remove from rooms
      for (const roomId of metrics.roomsSubscribed) {
        const room = this.rooms.get(roomId);
        if (room) {
          room.connections.delete(connectionId);
          if (room.connections.size === 0) {
            this.rooms.delete(roomId);
          }
        }
      }

      this.connectionMetrics.delete(connectionId);
    }

    this.emit('disconnection', { connectionId, metrics });
    console.log(`Connection ${connectionId} removed. Pool size: ${this.connections.size}`);
  }

  // Heartbeat and cleanup
  private startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      for (const [connectionId, ws] of this.connections) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
        } else {
          this.removeConnection(connectionId);
        }
      }
    }, this.config.heartbeatInterval);
  }

  private startCleanup() {
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      const idleTimeout = this.config.idleTimeout;

      for (const [connectionId, metrics] of this.connectionMetrics) {
        const idleTime = now - metrics.lastActivity.getTime();
        if (idleTime > idleTimeout) {
          console.log(`Removing idle connection ${connectionId}`);
          this.removeConnection(connectionId);
        }
      }
    }, 60000); // Check every minute
  }

  // Analytics and monitoring
  getPoolStats() {
    const rooms = Array.from(this.rooms.values());
    const totalBandwidth = Array.from(this.connectionMetrics.values())
      .reduce((sum, metrics) => sum + metrics.bandwidth, 0);

    return {
      totalConnections: this.connections.size,
      uniqueUsers: this.userConnections.size,
      totalRooms: this.rooms.size,
      totalBandwidth,
      averageLatency: this.getAverageLatency(),
      connectionsByRoom: rooms.map(room => ({
        roomId: room.id,
        connections: room.connections.size,
        type: room.metadata.type,
      })),
      clusterId: this.clusterId,
    };
  }

  private getAverageLatency(): number {
    const metrics = Array.from(this.connectionMetrics.values());
    if (metrics.length === 0) return 0;

    const totalLatency = metrics.reduce((sum, m) => sum + m.latency, 0);
    return totalLatency / metrics.length;
  }

  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Graceful shutdown
  async shutdown() {
    console.log('Shutting down WebSocket connection pool...');

    // Clear timers
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);

    // Close all connections
    for (const [connectionId, ws] of this.connections) {
      ws.close(1001, 'Server shutting down');
    }

    // Disconnect from Redis
    if (this.redisClient) {
      await this.redisClient.disconnect();
    }

    console.log('WebSocket connection pool shutdown complete');
  }
}

// Default configuration
export const defaultPoolConfig: PoolConfig = {
  maxConnections: 10000,
  maxConnectionsPerUser: 5,
  heartbeatInterval: 30000, // 30 seconds
  idleTimeout: 300000, // 5 minutes
  messageRateLimit: 10, // messages per second
  enableClustering: process.env.NODE_ENV === 'production',
  redisConfig: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  },
};

// Initialize global connection pool
export const connectionPool = new WebSocketConnectionPool(defaultPoolConfig);
