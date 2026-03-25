import { createClient } from '@/lib/supabase/client';

export type EventType = 
  | 'tournament' 
  | 'game_release' 
  | 'community_event' 
  | 'scrimmage' 
  | 'gaming_session' 
  | 'stream_schedule' 
  | 'maintenance'
  | 'league_match';

export type EventStatus = 'scheduled' | 'live' | 'completed' | 'cancelled' | 'postponed';

export type EventPriority = 'low' | 'medium' | 'high' | 'critical';

export interface GameEvent {
  id: string;
  title: string;
  description?: string;
  type: EventType;
  status: EventStatus;
  priority: EventPriority;
  
  // Timing
  start_time: string;
  end_time?: string;
  timezone: string;
  all_day: boolean;
  
  // Gaming specific
  game_id?: string;
  tournament_id?: string;
  match_id?: string;
  stream_id?: string;
  
  // Social
  organizer_id: string;
  participants: EventParticipant[];
  max_participants?: number;
  is_public: boolean;
  requires_approval: boolean;
  
  // Metadata
  location?: string;
  venue?: string;
  prize_pool?: number;
  entry_fee?: number;
  tags: string[];
  external_url?: string;
  cover_image?: string;
  
  // Notifications
  reminder_settings: ReminderSetting[];
  
  // Integration
  calendar_sync: CalendarSync;
  
  created_at: string;
  updated_at: string;
  
  // Relations
  game?: any;
  tournament?: any;
  organizer?: any;
}

export interface EventParticipant {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  status: 'confirmed' | 'maybe' | 'declined' | 'pending';
  role?: 'organizer' | 'participant' | 'spectator' | 'moderator';
  joined_at: string;
  team?: string;
}

export interface ReminderSetting {
  type: 'notification' | 'email' | 'sms';
  time_before: number; // minutes before event
  enabled: boolean;
  message?: string;
}

export interface CalendarSync {
  google_calendar?: boolean;
  outlook_calendar?: boolean;
  apple_calendar?: boolean;
  discord_events?: boolean;
  steam_events?: boolean;
}

export interface GameRelease {
  id: string;
  game_name: string;
  developer: string;
  publisher: string;
  release_date: string;
  platforms: string[];
  genres: string[];
  price?: number;
  pre_order_available: boolean;
  early_access_date?: string;
  beta_date?: string;
  cover_image: string;
  trailer_url?: string;
  steam_id?: string;
  epic_id?: string;
  description: string;
  hype_level: number; // 0-100
  user_interest: boolean;
  created_at: string;
}

export interface TournamentSchedule {
  tournament_id: string;
  tournament_name: string;
  game_id: string;
  organizer: string;
  start_date: string;
  end_date: string;
  registration_deadline: string;
  check_in_time: string;
  prize_pool: number;
  max_teams: number;
  current_teams: number;
  bracket_type: string;
  stream_url?: string;
  status: string;
}

export interface CalendarFilter {
  event_types?: EventType[];
  games?: string[];
  date_range?: {
    start: string;
    end: string;
  };
  priority?: EventPriority[];
  status?: EventStatus[];
  user_events_only?: boolean;
  friends_events?: boolean;
}

export interface CalendarStats {
  total_events: number;
  upcoming_events: number;
  events_this_week: number;
  events_this_month: number;
  tournaments_registered: number;
  gaming_sessions_scheduled: number;
  game_releases_tracked: number;
  friend_events: number;
}

export class GamingCalendarManager {
  private supabase = createClient();

  // Event Management
  async createEvent(eventData: Partial<GameEvent>): Promise<GameEvent | null> {
    try {
      const event: GameEvent = {
        id: crypto.randomUUID(),
        title: eventData.title || '',
        description: eventData.description,
        type: eventData.type || 'community_event',
        status: 'scheduled',
        priority: eventData.priority || 'medium',
        start_time: eventData.start_time || new Date().toISOString(),
        end_time: eventData.end_time,
        timezone: eventData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        all_day: eventData.all_day || false,
        game_id: eventData.game_id,
        tournament_id: eventData.tournament_id,
        match_id: eventData.match_id,
        stream_id: eventData.stream_id,
        organizer_id: eventData.organizer_id || 'current_user',
        participants: eventData.participants || [],
        max_participants: eventData.max_participants,
        is_public: eventData.is_public ?? true,
        requires_approval: eventData.requires_approval || false,
        location: eventData.location,
        venue: eventData.venue,
        prize_pool: eventData.prize_pool,
        entry_fee: eventData.entry_fee,
        tags: eventData.tags || [],
        external_url: eventData.external_url,
        cover_image: eventData.cover_image,
        reminder_settings: eventData.reminder_settings || [
          { type: 'notification', time_before: 30, enabled: true },
          { type: 'notification', time_before: 1440, enabled: false } // 24 hours
        ],
        calendar_sync: eventData.calendar_sync || {
          google_calendar: false,
          outlook_calendar: false,
          apple_calendar: false,
          discord_events: false,
          steam_events: false
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.supabase
        .from('gaming_events')
        .insert(event)
        .select(`
          *,
          game:games(*),
          organizer:profiles(*)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating event:', error);
      return null;
    }
  }

  async getEvents(filter?: CalendarFilter): Promise<GameEvent[]> {
    try {
      let query = this.supabase
        .from('gaming_events')
        .select(`
          *,
          game:games(*),
          organizer:profiles(*),
          tournament:tournaments(*)
        `);

      if (filter?.event_types && filter.event_types.length > 0) {
        query = query.in('type', filter.event_types);
      }

      if (filter?.games && filter.games.length > 0) {
        query = query.in('game_id', filter.games);
      }

      if (filter?.date_range) {
        query = query
          .gte('start_time', filter.date_range.start)
          .lte('start_time', filter.date_range.end);
      }

      if (filter?.status && filter.status.length > 0) {
        query = query.in('status', filter.status);
      }

      if (filter?.priority && filter.priority.length > 0) {
        query = query.in('priority', filter.priority);
      }

      const { data, error } = await query
        .order('start_time', { ascending: true })
        .limit(1000);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching events:', error);
      return [];
    }
  }

  async getEventById(eventId: string): Promise<GameEvent | null> {
    try {
      const { data, error } = await this.supabase
        .from('gaming_events')
        .select(`
          *,
          game:games(*),
          organizer:profiles(*),
          tournament:tournaments(*)
        `)
        .eq('id', eventId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching event:', error);
      return null;
    }
  }

  async updateEvent(eventId: string, updates: Partial<GameEvent>): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('gaming_events')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', eventId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating event:', error);
      return false;
    }
  }

  async deleteEvent(eventId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('gaming_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting event:', error);
      return false;
    }
  }

  // Participant Management
  async joinEvent(eventId: string, userId: string): Promise<boolean> {
    try {
      const event = await this.getEventById(eventId);
      if (!event) return false;

      // Check if already joined
      const alreadyJoined = event.participants.some(p => p.user_id === userId);
      if (alreadyJoined) return true;

      // Check capacity
      if (event.max_participants && event.participants.length >= event.max_participants) {
        return false;
      }

      const newParticipant: EventParticipant = {
        user_id: userId,
        username: 'user_' + userId.slice(-4),
        display_name: 'User ' + userId.slice(-4),
        status: event.requires_approval ? 'pending' : 'confirmed',
        role: 'participant',
        joined_at: new Date().toISOString()
      };

      const updatedParticipants = [...event.participants, newParticipant];
      
      return await this.updateEvent(eventId, { participants: updatedParticipants });
    } catch (error) {
      console.error('Error joining event:', error);
      return false;
    }
  }

  async leaveEvent(eventId: string, userId: string): Promise<boolean> {
    try {
      const event = await this.getEventById(eventId);
      if (!event) return false;

      const updatedParticipants = event.participants.filter(p => p.user_id !== userId);
      
      return await this.updateEvent(eventId, { participants: updatedParticipants });
    } catch (error) {
      console.error('Error leaving event:', error);
      return false;
    }
  }

  // Tournament Integration
  async syncTournamentEvents(): Promise<void> {
    try {
      const { data: tournaments, error } = await this.supabase
        .from('tournaments')
        .select('*')
        .in('status', ['registration_open', 'check_in', 'in_progress']);

      if (error) throw error;

      for (const tournament of tournaments || []) {
        // Create/update tournament events
        const existingEvent = await this.supabase
          .from('gaming_events')
          .select('id')
          .eq('tournament_id', tournament.id)
          .eq('type', 'tournament')
          .single();

        if (!existingEvent.data) {
          // Create new tournament event
          await this.createEvent({
            title: tournament.name,
            description: tournament.description,
            type: 'tournament',
            start_time: tournament.tournament_start,
            end_time: tournament.tournament_end,
            game_id: tournament.game_id,
            tournament_id: tournament.id,
            organizer_id: tournament.organizer_id,
            prize_pool: tournament.prize_pool,
            entry_fee: tournament.entry_fee,
            is_public: true,
            tags: ['tournament', 'esports'],
            priority: 'high'
          });
        }
      }
    } catch (error) {
      console.error('Error syncing tournament events:', error);
    }
  }

  // Game Release Tracking
  async trackGameRelease(gameData: Partial<GameRelease>): Promise<GameRelease | null> {
    try {
      const release: GameRelease = {
        id: crypto.randomUUID(),
        game_name: gameData.game_name || '',
        developer: gameData.developer || '',
        publisher: gameData.publisher || '',
        release_date: gameData.release_date || '',
        platforms: gameData.platforms || [],
        genres: gameData.genres || [],
        price: gameData.price,
        pre_order_available: gameData.pre_order_available || false,
        early_access_date: gameData.early_access_date,
        beta_date: gameData.beta_date,
        cover_image: gameData.cover_image || '',
        trailer_url: gameData.trailer_url,
        steam_id: gameData.steam_id,
        epic_id: gameData.epic_id,
        description: gameData.description || '',
        hype_level: gameData.hype_level || 50,
        user_interest: gameData.user_interest || false,
        created_at: new Date().toISOString()
      };

      const { data, error } = await this.supabase
        .from('game_releases')
        .insert(release)
        .select()
        .single();

      if (error) throw error;

      // Create calendar event for release
      await this.createEvent({
        title: `${release.game_name} Release`,
        description: `New game release: ${release.description}`,
        type: 'game_release',
        start_time: release.release_date,
        all_day: true,
        is_public: true,
        tags: ['game-release', ...release.genres],
        cover_image: release.cover_image,
        external_url: release.steam_id ? `https://store.steampowered.com/app/${release.steam_id}` : undefined,
        priority: release.hype_level > 80 ? 'high' : release.hype_level > 50 ? 'medium' : 'low'
      });

      return data;
    } catch (error) {
      console.error('Error tracking game release:', error);
      return null;
    }
  }

  async getGameReleases(upcoming: boolean = true): Promise<GameRelease[]> {
    try {
      let query = this.supabase
        .from('game_releases')
        .select('*');

      if (upcoming) {
        query = query.gte('release_date', new Date().toISOString());
      }

      const { data, error } = await query
        .order('release_date', { ascending: true })
        .limit(100);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching game releases:', error);
      return [];
    }
  }

  // Gaming Sessions
  async scheduleGamingSession(sessionData: {
    title: string;
    game_id: string;
    start_time: string;
    end_time?: string;
    max_participants?: number;
    description?: string;
    is_private?: boolean;
    invited_friends?: string[];
  }): Promise<GameEvent | null> {
    try {
      const participants: EventParticipant[] = [];
      
      // Add invited friends
      if (sessionData.invited_friends) {
        for (const friendId of sessionData.invited_friends) {
          participants.push({
            user_id: friendId,
            username: 'friend_' + friendId.slice(-4),
            display_name: 'Friend ' + friendId.slice(-4),
            status: 'pending',
            role: 'participant',
            joined_at: new Date().toISOString()
          });
        }
      }

      return await this.createEvent({
        title: sessionData.title,
        description: sessionData.description,
        type: 'gaming_session',
        start_time: sessionData.start_time,
        end_time: sessionData.end_time,
        game_id: sessionData.game_id,
        max_participants: sessionData.max_participants || 8,
        is_public: !sessionData.is_private,
        participants,
        tags: ['gaming-session', 'multiplayer'],
        priority: 'medium'
      });
    } catch (error) {
      console.error('Error scheduling gaming session:', error);
      return null;
    }
  }

  // Statistics
  async getCalendarStats(userId?: string): Promise<CalendarStats> {
    try {
      const now = new Date();
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      let query = this.supabase.from('gaming_events').select('*');
      
      if (userId) {
        // Filter by user's events (organized or participating)
        query = query.or(`organizer_id.eq.${userId},participants.cs.{"user_id":"${userId}"}`);
      }

      const { data: allEvents } = await query;
      const events = allEvents || [];

      const stats: CalendarStats = {
        total_events: events.length,
        upcoming_events: events.filter(e => new Date(e.start_time) > new Date()).length,
        events_this_week: events.filter(e => new Date(e.start_time) >= weekStart).length,
        events_this_month: events.filter(e => new Date(e.start_time) >= monthStart).length,
        tournaments_registered: events.filter(e => e.type === 'tournament').length,
        gaming_sessions_scheduled: events.filter(e => e.type === 'gaming_session').length,
        game_releases_tracked: events.filter(e => e.type === 'game_release').length,
        friend_events: events.filter(e => e.type === 'gaming_session' && e.participants.length > 1).length
      };

      return stats;
    } catch (error) {
      console.error('Error getting calendar stats:', error);
      return {
        total_events: 0,
        upcoming_events: 0,
        events_this_week: 0,
        events_this_month: 0,
        tournaments_registered: 0,
        gaming_sessions_scheduled: 0,
        game_releases_tracked: 0,
        friend_events: 0
      };
    }
  }

  // Notifications and Reminders
  async scheduleReminders(eventId: string): Promise<void> {
    try {
      const event = await this.getEventById(eventId);
      if (!event) return;

      for (const reminder of event.reminder_settings) {
        if (!reminder.enabled) continue;

        const reminderTime = new Date(event.start_time);
        reminderTime.setMinutes(reminderTime.getMinutes() - reminder.time_before);

        // Schedule reminder (would integrate with notification system)
        await this.supabase
          .from('scheduled_notifications')
          .insert({
            user_id: event.organizer_id,
            event_id: eventId,
            type: reminder.type,
            scheduled_for: reminderTime.toISOString(),
            message: reminder.message || `Reminder: ${event.title} starts in ${reminder.time_before} minutes`,
            created_at: new Date().toISOString()
          });
      }
    } catch (error) {
      console.error('Error scheduling reminders:', error);
    }
  }

  // Import/Export
  async exportToICS(eventIds: string[]): Promise<string> {
    try {
      const events = await Promise.all(
        eventIds.map(id => this.getEventById(id))
      );

      const validEvents = events.filter(Boolean) as GameEvent[];
      
      // Generate ICS calendar format
      let ics = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//IgnisStream//Gaming Calendar//EN\n';
      
      for (const event of validEvents) {
        ics += 'BEGIN:VEVENT\n';
        ics += `UID:${event.id}\n`;
        ics += `DTSTART:${new Date(event.start_time).toISOString().replace(/[-:]/g, '').split('.')[0]}Z\n`;
        if (event.end_time) {
          ics += `DTEND:${new Date(event.end_time).toISOString().replace(/[-:]/g, '').split('.')[0]}Z\n`;
        }
        ics += `SUMMARY:${event.title}\n`;
        if (event.description) {
          ics += `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}\n`;
        }
        if (event.location) {
          ics += `LOCATION:${event.location}\n`;
        }
        ics += `CATEGORIES:${event.tags.join(',')}\n`;
        ics += 'END:VEVENT\n';
      }
      
      ics += 'END:VCALENDAR';
      return ics;
    } catch (error) {
      console.error('Error exporting to ICS:', error);
      return '';
    }
  }
}

export const gamingCalendarManager = new GamingCalendarManager();
