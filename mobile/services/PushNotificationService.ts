import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationData {
  type: 'tournament_start' | 'match_start' | 'match_result' | 'registration_reminder' | 'bracket_update' | 'team_invite';
  tournament_id?: string;
  match_id?: string;
  team_id?: string;
  title: string;
  body: string;
  data?: any;
  scheduled_time?: string;
}

export interface NotificationSubscription {
  user_id: string;
  push_token: string;
  device_type: 'ios' | 'android';
  preferences: NotificationPreferences;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferences {
  tournament_updates: boolean;
  match_reminders: boolean;
  team_invitations: boolean;
  bracket_changes: boolean;
  score_updates: boolean;
  stream_notifications: boolean;
  friend_activities: boolean;
}

class PushNotificationService {
  private expoPushToken: string | null = null;
  private notificationListener: any = null;
  private responseListener: any = null;

  async initialize(): Promise<void> {
    try {
      await this.requestPermissions();
      await this.registerForPushNotifications();
      this.setupNotificationListeners();
      await this.loadUserPreferences();
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
    }
  }

  private async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.log('Push notifications only work on physical devices');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return false;
    }

    return true;
  }

  private async registerForPushNotifications(): Promise<void> {
    try {
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      this.expoPushToken = token;

      // Store token in AsyncStorage
      await AsyncStorage.setItem('expo_push_token', token);

      // Register token with backend
      await this.registerTokenWithBackend(token);

      console.log('Push token registered:', token);
    } catch (error) {
      console.error('Error registering for push notifications:', error);
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('tournament', {
        name: 'Tournament Notifications',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'tournament_notification.wav',
      });

      await Notifications.setNotificationChannelAsync('match', {
        name: 'Match Notifications',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4F46E5',
        sound: 'match_notification.wav',
      });

      await Notifications.setNotificationChannelAsync('team', {
        name: 'Team Notifications',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250],
        lightColor: '#10B981',
      });
    }
  }

  private async registerTokenWithBackend(token: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const subscription: Partial<NotificationSubscription> = {
        user_id: user.id,
        push_token: token,
        device_type: Platform.OS as 'ios' | 'android',
        preferences: await this.getDefaultPreferences(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('push_notification_subscriptions')
        .upsert(subscription, { onConflict: 'user_id,device_type' });

      if (error) {
        console.error('Error registering token with backend:', error);
      }
    } catch (error) {
      console.error('Error in registerTokenWithBackend:', error);
    }
  }

  private setupNotificationListeners(): void {
    // Handle notifications received while app is in foreground
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
        this.handleNotificationReceived(notification);
      }
    );

    // Handle notification tap/interaction
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification response:', response);
        this.handleNotificationResponse(response);
      }
    );
  }

  private handleNotificationReceived(notification: Notifications.Notification): void {
    const { data } = notification.request.content;
    
    // Custom handling based on notification type
    switch (data?.type) {
      case 'match_start':
        this.handleMatchStartNotification(data);
        break;
      case 'tournament_start':
        this.handleTournamentStartNotification(data);
        break;
      case 'team_invite':
        this.handleTeamInviteNotification(data);
        break;
      default:
        break;
    }
  }

  private handleNotificationResponse(response: Notifications.NotificationResponse): void {
    const { data } = response.notification.request.content;
    
    // Navigate to appropriate screen based on notification type
    // This would integrate with your navigation system
    switch (data?.type) {
      case 'match_start':
        // Navigate to match details screen
        break;
      case 'tournament_start':
        // Navigate to tournament bracket screen
        break;
      case 'team_invite':
        // Navigate to team invitation screen
        break;
      default:
        break;
    }
  }

  // Tournament-specific notification methods
  async scheduleTournamentReminder(
    tournamentId: string,
    tournamentName: string,
    startTime: string,
    reminderMinutes: number = 30
  ): Promise<string | null> {
    try {
      const scheduledTime = new Date(startTime);
      scheduledTime.setMinutes(scheduledTime.getMinutes() - reminderMinutes);

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🏆 Tournament Starting Soon!',
          body: `${tournamentName} starts in ${reminderMinutes} minutes. Get ready!`,
          data: {
            type: 'tournament_start',
            tournament_id: tournamentId,
          },
          sound: 'tournament_notification.wav',
        },
        trigger: {
          date: scheduledTime,
        },
      });

      // Store scheduled notification ID for potential cancellation
      await AsyncStorage.setItem(`tournament_reminder_${tournamentId}`, notificationId);
      
      return notificationId;
    } catch (error) {
      console.error('Error scheduling tournament reminder:', error);
      return null;
    }
  }

  async scheduleMatchReminder(
    matchId: string,
    team1Name: string,
    team2Name: string,
    matchTime: string,
    reminderMinutes: number = 15
  ): Promise<string | null> {
    try {
      const scheduledTime = new Date(matchTime);
      scheduledTime.setMinutes(scheduledTime.getMinutes() - reminderMinutes);

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '⚔️ Match Starting Soon!',
          body: `${team1Name} vs ${team2Name} starts in ${reminderMinutes} minutes`,
          data: {
            type: 'match_start',
            match_id: matchId,
          },
          sound: 'match_notification.wav',
        },
        trigger: {
          date: scheduledTime,
        },
      });

      await AsyncStorage.setItem(`match_reminder_${matchId}`, notificationId);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling match reminder:', error);
      return null;
    }
  }

  async sendMatchResultNotification(
    matchId: string,
    winnerName: string,
    loserName: string,
    score: string
  ): Promise<void> {
    try {
      await Notifications.presentNotificationAsync({
        title: '🎉 Match Completed!',
        body: `${winnerName} defeated ${loserName} (${score})`,
        data: {
          type: 'match_result',
          match_id: matchId,
        },
        sound: 'victory_notification.wav',
      });
    } catch (error) {
      console.error('Error sending match result notification:', error);
    }
  }

  async sendBracketUpdateNotification(
    tournamentId: string,
    tournamentName: string,
    updateMessage: string
  ): Promise<void> {
    try {
      await Notifications.presentNotificationAsync({
        title: '📋 Bracket Updated',
        body: `${tournamentName}: ${updateMessage}`,
        data: {
          type: 'bracket_update',
          tournament_id: tournamentId,
        },
      });
    } catch (error) {
      console.error('Error sending bracket update notification:', error);
    }
  }

  async sendTeamInviteNotification(
    teamId: string,
    teamName: string,
    inviterName: string
  ): Promise<void> {
    try {
      await Notifications.presentNotificationAsync({
        title: '👥 Team Invitation',
        body: `${inviterName} invited you to join ${teamName}`,
        data: {
          type: 'team_invite',
          team_id: teamId,
        },
        sound: 'invite_notification.wav',
      });
    } catch (error) {
      console.error('Error sending team invite notification:', error);
    }
  }

  // Preference management
  async updateNotificationPreferences(preferences: Partial<NotificationPreferences>): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('push_notification_subscriptions')
        .update({ 
          preferences,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating notification preferences:', error);
      } else {
        // Store locally for quick access
        await AsyncStorage.setItem('notification_preferences', JSON.stringify(preferences));
      }
    } catch (error) {
      console.error('Error in updateNotificationPreferences:', error);
    }
  }

  async getNotificationPreferences(): Promise<NotificationPreferences> {
    try {
      // First try to get from local storage
      const localPrefs = await AsyncStorage.getItem('notification_preferences');
      if (localPrefs) {
        return JSON.parse(localPrefs);
      }

      // Fallback to backend
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return this.getDefaultPreferences();

      const { data, error } = await supabase
        .from('push_notification_subscriptions')
        .select('preferences')
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        return this.getDefaultPreferences();
      }

      return data.preferences;
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      return this.getDefaultPreferences();
    }
  }

  private async getDefaultPreferences(): Promise<NotificationPreferences> {
    return {
      tournament_updates: true,
      match_reminders: true,
      team_invitations: true,
      bracket_changes: true,
      score_updates: true,
      stream_notifications: false,
      friend_activities: false,
    };
  }

  private async loadUserPreferences(): Promise<void> {
    const preferences = await this.getNotificationPreferences();
    await AsyncStorage.setItem('notification_preferences', JSON.stringify(preferences));
  }

  // Notification handlers
  private handleMatchStartNotification(data: any): void {
    // Custom handling for match start notifications
    // Could update local state, show custom UI, etc.
  }

  private handleTournamentStartNotification(data: any): void {
    // Custom handling for tournament start notifications
  }

  private handleTeamInviteNotification(data: any): void {
    // Custom handling for team invite notifications
    // Could show in-app modal or update team invitation state
  }

  // Utility methods
  async cancelScheduledNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error canceling scheduled notification:', error);
    }
  }

  async cancelTournamentReminder(tournamentId: string): Promise<void> {
    try {
      const notificationId = await AsyncStorage.getItem(`tournament_reminder_${tournamentId}`);
      if (notificationId) {
        await this.cancelScheduledNotification(notificationId);
        await AsyncStorage.removeItem(`tournament_reminder_${tournamentId}`);
      }
    } catch (error) {
      console.error('Error canceling tournament reminder:', error);
    }
  }

  async cancelMatchReminder(matchId: string): Promise<void> {
    try {
      const notificationId = await AsyncStorage.getItem(`match_reminder_${matchId}`);
      if (notificationId) {
        await this.cancelScheduledNotification(notificationId);
        await AsyncStorage.removeItem(`match_reminder_${matchId}`);
      }
    } catch (error) {
      console.error('Error canceling match reminder:', error);
    }
  }

  async getBadgeCount(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('Error getting badge count:', error);
      return 0;
    }
  }

  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  }

  async clearBadge(): Promise<void> {
    await this.setBadgeCount(0);
  }

  // Cleanup
  cleanup(): void {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }

  // Get push token for backend integration
  getPushToken(): string | null {
    return this.expoPushToken;
  }

  // Check if device supports push notifications
  isDeviceSupported(): boolean {
    return Device.isDevice;
  }
}

export const pushNotificationService = new PushNotificationService();
