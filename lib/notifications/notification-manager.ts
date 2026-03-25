/**
 * Advanced Push Notification Manager for IgnisStream
 * Handles real-time gaming notifications with rich content and actions
 */

import { createClient } from '@supabase/supabase-js';

interface NotificationPayload {
  id: string;
  type: 'achievement' | 'message' | 'friend_request' | 'tournament' | 'stream' | 'match_found' | 'level_up';
  title: string;
  body: string;
  icon?: string;
  image?: string;
  badge?: string;
  sound?: string;
  vibrate?: number[];
  actions?: NotificationAction[];
  data?: Record<string, any>;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  silent?: boolean;
  requireInteraction?: boolean;
  tag?: string;
  renotify?: boolean;
  timestamp?: number;
}

interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
  type?: 'button' | 'text';
  placeholder?: string;
}

interface NotificationPreferences {
  achievements: boolean;
  messages: boolean;
  friendRequests: boolean;
  tournaments: boolean;
  streams: boolean;
  matchmaking: boolean;
  levelUps: boolean;
  sound: boolean;
  vibration: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string;   // HH:mm format
  };
  gameSpecific: Record<string, boolean>;
}

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export class NotificationManager {
  private supabase: any;
  private vapidKeys: {
    publicKey: string;
    privateKey: string;
  };
  private subscription: PushSubscription | null = null;
  private preferences: NotificationPreferences;
  private isInitialized = false;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    this.vapidKeys = {
      publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      privateKey: process.env.VAPID_PRIVATE_KEY!,
    };

    this.preferences = this.getDefaultPreferences();
  }

  // Initialize notification system
  async initialize(userId: string): Promise<boolean> {
    try {
      // Request notification permission
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        console.log('Notification permission denied');
        return false;
      }

      // Register service worker if not already registered
      await this.registerServiceWorker();

      // Subscribe to push notifications
      await this.subscribeToPush(userId);

      // Load user preferences
      await this.loadPreferences(userId);

      // Set up real-time listeners
      this.setupRealtimeListeners(userId);

      this.isInitialized = true;
      console.log('Notification system initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      return false;
    }
  }

  private async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications');
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  private async registerServiceWorker(): Promise<ServiceWorkerRegistration> {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Worker not supported');
    }

    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;
    return registration;
  }

  private async subscribeToPush(userId: string): Promise<void> {
    const registration = await navigator.serviceWorker.ready;
    
    if (!registration.pushManager) {
      throw new Error('Push messaging not supported');
    }

    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      // Create new subscription
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidKeys.publicKey),
      });
    }

    this.subscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
        auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!))),
      },
    };

    // Save subscription to database
    await this.saveSubscription(userId, this.subscription);
  }

  private async saveSubscription(userId: string, subscription: PushSubscription): Promise<void> {
    const { error } = await this.supabase
      .from('push_subscriptions')
      .upsert({
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh_key: subscription.keys.p256dh,
        auth_key: subscription.keys.auth,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Failed to save push subscription:', error);
      throw error;
    }
  }

  // Real-time notification listeners
  private setupRealtimeListeners(userId: string): void {
    // Listen for achievements
    this.supabase
      .channel('user_achievements')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_achievements',
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          this.handleAchievementUnlocked(payload.new);
        }
      )
      .subscribe();

    // Listen for messages
    this.supabase
      .channel('user_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${userId}`,
        },
        (payload: any) => {
          this.handleNewMessage(payload.new);
        }
      )
      .subscribe();

    // Listen for friend requests
    this.supabase
      .channel('friend_requests')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'follows',
          filter: `following_id=eq.${userId}`,
        },
        (payload: any) => {
          this.handleFriendRequest(payload.new);
        }
      )
      .subscribe();

    // Listen for tournament updates
    this.supabase
      .channel('tournament_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tournaments',
        },
        (payload: any) => {
          this.handleTournamentUpdate(payload.new);
        }
      )
      .subscribe();
  }

  // Gaming-specific notification handlers
  private async handleAchievementUnlocked(achievement: any): Promise<void> {
    if (!this.preferences.achievements) return;

    const notification: NotificationPayload = {
      id: `achievement_${achievement.id}`,
      type: 'achievement',
      title: '🏆 Achievement Unlocked!',
      body: achievement.description || achievement.title,
      icon: '/icons/achievement.png',
      image: achievement.icon_url,
      badge: '/icons/badge.png',
      sound: this.preferences.sound ? '/sounds/achievement.mp3' : undefined,
      vibrate: this.preferences.vibration ? [200, 100, 200, 100, 200] : undefined,
      priority: 'high',
      requireInteraction: true,
      tag: 'achievement',
      actions: [
        {
          action: 'view_achievement',
          title: 'View Achievement',
          icon: '/icons/view.png',
        },
        {
          action: 'share_achievement',
          title: 'Share',
          icon: '/icons/share.png',
        },
      ],
      data: {
        achievementId: achievement.id,
        gameId: achievement.game_id,
        url: '/profile/achievements',
      },
    };

    await this.sendNotification(notification);
    this.playAchievementSound();
  }

  private async handleNewMessage(message: any): Promise<void> {
    if (!this.preferences.messages) return;

    // Get sender info
    const { data: sender } = await this.supabase
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('id', message.sender_id)
      .single();

    const notification: NotificationPayload = {
      id: `message_${message.id}`,
      type: 'message',
      title: `💬 Message from ${sender?.display_name || 'Unknown'}`,
      body: message.content.length > 100 
        ? `${message.content.substring(0, 100)}...` 
        : message.content,
      icon: sender?.avatar_url || '/icons/user.png',
      badge: '/icons/badge.png',
      sound: this.preferences.sound ? '/sounds/message.mp3' : undefined,
      vibrate: this.preferences.vibration ? [100, 50, 100] : undefined,
      priority: 'normal',
      tag: `conversation_${message.conversation_id}`,
      actions: [
        {
          action: 'reply',
          title: 'Reply',
          type: 'text',
          placeholder: 'Type your reply...',
          icon: '/icons/reply.png',
        },
        {
          action: 'view_conversation',
          title: 'Open Chat',
          icon: '/icons/chat.png',
        },
      ],
      data: {
        messageId: message.id,
        conversationId: message.conversation_id,
        senderId: message.sender_id,
        url: `/messages/${message.conversation_id}`,
      },
    };

    await this.sendNotification(notification);
  }

  private async handleFriendRequest(friendRequest: any): Promise<void> {
    if (!this.preferences.friendRequests) return;

    // Get requester info
    const { data: requester } = await this.supabase
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('id', friendRequest.follower_id)
      .single();

    const notification: NotificationPayload = {
      id: `friend_request_${friendRequest.id}`,
      type: 'friend_request',
      title: '👥 New Friend Request',
      body: `${requester?.display_name || 'Someone'} wants to be your gaming buddy!`,
      icon: requester?.avatar_url || '/icons/user.png',
      badge: '/icons/badge.png',
      sound: this.preferences.sound ? '/sounds/friend-request.mp3' : undefined,
      vibrate: this.preferences.vibration ? [150, 75, 150] : undefined,
      priority: 'normal',
      tag: 'friend_request',
      requireInteraction: true,
      actions: [
        {
          action: 'accept_friend',
          title: 'Accept',
          icon: '/icons/accept.png',
        },
        {
          action: 'decline_friend',
          title: 'Decline',
          icon: '/icons/decline.png',
        },
        {
          action: 'view_profile',
          title: 'View Profile',
          icon: '/icons/profile.png',
        },
      ],
      data: {
        friendRequestId: friendRequest.id,
        requesterId: friendRequest.follower_id,
        url: `/profile/${requester?.display_name}`,
      },
    };

    await this.sendNotification(notification);
  }

  private async handleTournamentUpdate(tournament: any): Promise<void> {
    if (!this.preferences.tournaments) return;

    let title = '🏆 Tournament Update';
    let body = '';

    switch (tournament.status) {
      case 'starting':
        title = '🚀 Tournament Starting!';
        body = `${tournament.name} is about to begin!`;
        break;
      case 'completed':
        title = '🏁 Tournament Completed!';
        body = `${tournament.name} has ended. Check the results!`;
        break;
      default:
        body = `Updates available for ${tournament.name}`;
    }

    const notification: NotificationPayload = {
      id: `tournament_${tournament.id}`,
      type: 'tournament',
      title,
      body,
      icon: '/icons/tournament.png',
      image: tournament.banner_url,
      badge: '/icons/badge.png',
      sound: this.preferences.sound ? '/sounds/tournament.mp3' : undefined,
      vibrate: this.preferences.vibration ? [200, 100, 200] : undefined,
      priority: 'high',
      tag: 'tournament',
      actions: [
        {
          action: 'view_tournament',
          title: 'View Tournament',
          icon: '/icons/view.png',
        },
        {
          action: 'join_tournament',
          title: 'Join Now',
          icon: '/icons/join.png',
        },
      ],
      data: {
        tournamentId: tournament.id,
        url: `/tournaments/${tournament.id}`,
      },
    };

    await this.sendNotification(notification);
  }

  // Send notification
  private async sendNotification(payload: NotificationPayload): Promise<void> {
    if (!this.isInQuietHours() && this.shouldSendNotification(payload.type)) {
      try {
        // Send to server for push notification
        await fetch('/api/notifications/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        // Show local notification as fallback
        if ('Notification' in window && Notification.permission === 'granted') {
          await this.showLocalNotification(payload);
        }
      } catch (error) {
        console.error('Failed to send notification:', error);
      }
    }
  }

  private async showLocalNotification(payload: NotificationPayload): Promise<void> {
    const registration = await navigator.serviceWorker.ready;
    
    await registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon,
      image: payload.image,
      badge: payload.badge,
      vibrate: payload.vibrate,
      actions: payload.actions?.map(action => ({
        action: action.action,
        title: action.title,
        icon: action.icon,
      })),
      data: payload.data,
      tag: payload.tag,
      renotify: payload.renotify,
      requireInteraction: payload.requireInteraction,
      silent: payload.silent,
    });
  }

  // Gaming-specific notification methods
  async showMatchFoundNotification(matchData: {
    gameTitle: string;
    matchType: string;
    playersFound: number;
    totalPlayers: number;
    estimatedWaitTime: number;
  }): Promise<void> {
    const notification: NotificationPayload = {
      id: `match_found_${Date.now()}`,
      type: 'match_found',
      title: '🎮 Match Found!',
      body: `${matchData.gameTitle} - ${matchData.matchType} (${matchData.playersFound}/${matchData.totalPlayers})`,
      icon: '/icons/match.png',
      priority: 'urgent',
      requireInteraction: true,
      sound: this.preferences.sound ? '/sounds/match-found.mp3' : undefined,
      vibrate: this.preferences.vibration ? [300, 100, 300, 100, 300] : undefined,
      actions: [
        {
          action: 'accept_match',
          title: 'Accept',
          icon: '/icons/accept.png',
        },
        {
          action: 'decline_match',
          title: 'Decline',
          icon: '/icons/decline.png',
        },
      ],
      data: {
        matchType: matchData.matchType,
        gameTitle: matchData.gameTitle,
        url: '/matchmaking',
      },
    };

    await this.sendNotification(notification);
  }

  async showLevelUpNotification(levelData: {
    newLevel: number;
    gameTitle: string;
    rewards?: string[];
  }): Promise<void> {
    const notification: NotificationPayload = {
      id: `level_up_${Date.now()}`,
      type: 'level_up',
      title: '⬆️ Level Up!',
      body: `You've reached level ${levelData.newLevel} in ${levelData.gameTitle}!`,
      icon: '/icons/level-up.png',
      priority: 'high',
      requireInteraction: true,
      sound: this.preferences.sound ? '/sounds/level-up.mp3' : undefined,
      vibrate: this.preferences.vibration ? [200, 50, 200, 50, 200] : undefined,
      actions: [
        {
          action: 'view_rewards',
          title: 'View Rewards',
          icon: '/icons/rewards.png',
        },
        {
          action: 'continue_playing',
          title: 'Keep Playing',
          icon: '/icons/play.png',
        },
      ],
      data: {
        level: levelData.newLevel,
        gameTitle: levelData.gameTitle,
        rewards: levelData.rewards,
        url: '/profile/progress',
      },
    };

    await this.sendNotification(notification);
  }

  // Preferences management
  async updatePreferences(userId: string, newPreferences: Partial<NotificationPreferences>): Promise<void> {
    this.preferences = { ...this.preferences, ...newPreferences };
    
    const { error } = await this.supabase
      .from('notification_preferences')
      .upsert({
        user_id: userId,
        preferences: this.preferences,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Failed to update notification preferences:', error);
      throw error;
    }
  }

  private async loadPreferences(userId: string): Promise<void> {
    const { data, error } = await this.supabase
      .from('notification_preferences')
      .select('preferences')
      .eq('user_id', userId)
      .single();

    if (data && !error) {
      this.preferences = { ...this.getDefaultPreferences(), ...data.preferences };
    }
  }

  private getDefaultPreferences(): NotificationPreferences {
    return {
      achievements: true,
      messages: true,
      friendRequests: true,
      tournaments: true,
      streams: false,
      matchmaking: true,
      levelUps: true,
      sound: true,
      vibration: true,
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00',
      },
      gameSpecific: {},
    };
  }

  // Utility methods
  private isInQuietHours(): boolean {
    if (!this.preferences.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const { start, end } = this.preferences.quietHours;
    
    if (start <= end) {
      return currentTime >= start && currentTime <= end;
    } else {
      return currentTime >= start || currentTime <= end;
    }
  }

  private shouldSendNotification(type: NotificationPayload['type']): boolean {
    switch (type) {
      case 'achievement':
        return this.preferences.achievements;
      case 'message':
        return this.preferences.messages;
      case 'friend_request':
        return this.preferences.friendRequests;
      case 'tournament':
        return this.preferences.tournaments;
      case 'stream':
        return this.preferences.streams;
      case 'match_found':
        return this.preferences.matchmaking;
      case 'level_up':
        return this.preferences.levelUps;
      default:
        return true;
    }
  }

  private playAchievementSound(): void {
    if (this.preferences.sound) {
      try {
        const audio = new Audio('/sounds/achievement.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {}); // Ignore errors
      } catch (error) {
        console.error('Failed to play achievement sound:', error);
      }
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
  }

  // Cleanup
  async unsubscribe(userId: string): Promise<void> {
    if (this.subscription) {
      const registration = await navigator.serviceWorker.ready;
      const pushSubscription = await registration.pushManager.getSubscription();
      
      if (pushSubscription) {
        await pushSubscription.unsubscribe();
      }

      // Remove from database
      await this.supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', userId);

      this.subscription = null;
    }
  }
}

// Initialize global notification manager
export const notificationManager = new NotificationManager();
