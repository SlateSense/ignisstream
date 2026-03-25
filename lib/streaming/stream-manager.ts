import { createClient } from '@/lib/supabase/client';

export interface Stream {
  id: string;
  title: string;
  description: string;
  game_id?: string;
  streamer_id: string;
  status: 'live' | 'offline' | 'ended';
  viewer_count: number;
  started_at: string;
  ended_at?: string;
  thumbnail_url?: string;
  stream_key: string;
  rtmp_url: string;
  hls_url?: string;
  category: string;
  tags: string[];
  is_mature: boolean;
  max_viewers: number;
  total_watch_time: number;
}

export interface StreamSettings {
  title: string;
  description: string;
  game_id?: string;
  category: string;
  tags: string[];
  is_mature: boolean;
  quality: 'low' | 'medium' | 'high' | 'ultra';
  bitrate: number;
  fps: number;
}

export interface ChatMessage {
  id: string;
  stream_id: string;
  user_id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  message: string;
  timestamp: string;
  is_moderator: boolean;
  is_subscriber: boolean;
  badges: string[];
}

export class StreamManager {
  private supabase = createClient();

  // Stream Management
  async createStream(userId: string, settings: StreamSettings): Promise<Stream> {
    const streamKey = this.generateStreamKey();
    const rtmpUrl = `rtmp://stream.ignisstream.com/live/${streamKey}`;
    
    const { data, error } = await this.supabase
      .from('streams')
      .insert({
        title: settings.title,
        description: settings.description,
        game_id: settings.game_id,
        streamer_id: userId,
        status: 'offline',
        viewer_count: 0,
        stream_key: streamKey,
        rtmp_url: rtmpUrl,
        category: settings.category,
        tags: settings.tags,
        is_mature: settings.is_mature,
        max_viewers: 0,
        total_watch_time: 0
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async startStream(streamId: string): Promise<void> {
    const { error } = await this.supabase
      .from('streams')
      .update({
        status: 'live',
        started_at: new Date().toISOString(),
        viewer_count: 0
      })
      .eq('id', streamId);

    if (error) throw error;

    // Start real-time viewer tracking
    this.startViewerTracking(streamId);
  }

  async endStream(streamId: string): Promise<void> {
    const { error } = await this.supabase
      .from('streams')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString()
      })
      .eq('id', streamId);

    if (error) throw error;
  }

  async updateStreamSettings(streamId: string, settings: Partial<StreamSettings>): Promise<void> {
    const { error } = await this.supabase
      .from('streams')
      .update(settings)
      .eq('id', streamId);

    if (error) throw error;
  }

  // Stream Discovery
  async getLiveStreams(limit = 20, offset = 0): Promise<Stream[]> {
    const { data, error } = await this.supabase
      .from('streams')
      .select(`
        *,
        streamer:profiles!streamer_id(username, display_name, avatar_url),
        game:games(id, name, cover_url)
      `)
      .eq('status', 'live')
      .order('viewer_count', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  }

  async getStreamsByCategory(category: string, limit = 20): Promise<Stream[]> {
    const { data, error } = await this.supabase
      .from('streams')
      .select(`
        *,
        streamer:profiles!streamer_id(username, display_name, avatar_url),
        game:games(id, name, cover_url)
      `)
      .eq('status', 'live')
      .eq('category', category)
      .order('viewer_count', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async getStreamsByGame(gameId: string, limit = 20): Promise<Stream[]> {
    const { data, error } = await this.supabase
      .from('streams')
      .select(`
        *,
        streamer:profiles!streamer_id(username, display_name, avatar_url),
        game:games(id, name, cover_url)
      `)
      .eq('status', 'live')
      .eq('game_id', gameId)
      .order('viewer_count', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async getStream(streamId: string): Promise<Stream | null> {
    const { data, error } = await this.supabase
      .from('streams')
      .select(`
        *,
        streamer:profiles!streamer_id(username, display_name, avatar_url),
        game:games(id, name, cover_url)
      `)
      .eq('id', streamId)
      .single();

    if (error) return null;
    return data;
  }

  // Stream Analytics
  async updateViewerCount(streamId: string, count: number): Promise<void> {
    const { data: stream } = await this.supabase
      .from('streams')
      .select('max_viewers')
      .eq('id', streamId)
      .single();

    const maxViewers = Math.max(stream?.max_viewers || 0, count);

    const { error } = await this.supabase
      .from('streams')
      .update({
        viewer_count: count,
        max_viewers: maxViewers
      })
      .eq('id', streamId);

    if (error) throw error;
  }

  async recordWatchTime(streamId: string, userId: string, duration: number): Promise<void> {
    // Record individual watch session
    await this.supabase
      .from('stream_views')
      .insert({
        stream_id: streamId,
        viewer_id: userId,
        duration: duration,
        viewed_at: new Date().toISOString()
      });

    // Update total watch time
    const { error } = await this.supabase.rpc('increment_watch_time', {
      stream_id: streamId,
      duration: duration
    });

    if (error) console.error('Error updating watch time:', error);
  }

  // Chat Management
  async sendChatMessage(streamId: string, userId: string, message: string): Promise<ChatMessage> {
    const { data: user } = await this.supabase
      .from('profiles')
      .select('username, display_name, avatar_url')
      .eq('id', userId)
      .single();

    const chatMessage: Omit<ChatMessage, 'id'> = {
      stream_id: streamId,
      user_id: userId,
      username: user?.username || 'Anonymous',
      display_name: user?.display_name || 'Anonymous',
      avatar_url: user?.avatar_url,
      message,
      timestamp: new Date().toISOString(),
      is_moderator: false, // TODO: Check if user is moderator
      is_subscriber: false, // TODO: Check if user is subscriber
      badges: []
    };

    const { data, error } = await this.supabase
      .from('stream_chat')
      .insert(chatMessage)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getChatMessages(streamId: string, limit = 50): Promise<ChatMessage[]> {
    const { data, error } = await this.supabase
      .from('stream_chat')
      .select('*')
      .eq('stream_id', streamId)
      .order('timestamp', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async deleteChatMessage(messageId: string, moderatorId: string): Promise<void> {
    // TODO: Verify moderator permissions
    const { error } = await this.supabase
      .from('stream_chat')
      .delete()
      .eq('id', messageId);

    if (error) throw error;
  }

  // VOD (Video on Demand) Management
  async createVOD(streamId: string): Promise<void> {
    const { data: stream } = await this.supabase
      .from('streams')
      .select('*')
      .eq('id', streamId)
      .single();

    if (!stream) return;

    await this.supabase
      .from('vods')
      .insert({
        stream_id: streamId,
        title: stream.title,
        description: stream.description,
        streamer_id: stream.streamer_id,
        game_id: stream.game_id,
        duration: this.calculateStreamDuration(stream.started_at, stream.ended_at),
        view_count: 0,
        thumbnail_url: stream.thumbnail_url,
        video_url: `${stream.hls_url}/recording.m3u8`,
        created_at: new Date().toISOString(),
        category: stream.category,
        tags: stream.tags,
        is_mature: stream.is_mature,
        max_viewers: stream.max_viewers
      });
  }

  async getVODs(limit = 20, offset = 0): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('vods')
      .select(`
        *,
        streamer:profiles!streamer_id(username, display_name, avatar_url),
        game:games(id, name, cover_url)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  }

  // Utility Functions
  private generateStreamKey(): string {
    return `sk_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
  }

  private calculateStreamDuration(startTime: string, endTime?: string): number {
    if (!endTime) return 0;
    const start = new Date(startTime);
    const end = new Date(endTime);
    return Math.floor((end.getTime() - start.getTime()) / 1000); // Duration in seconds
  }

  private async startViewerTracking(streamId: string): Promise<void> {
    // Subscribe to real-time viewer updates
    const channel = this.supabase.channel(`stream-${streamId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const viewerCount = Object.keys(state).length;
        this.updateViewerCount(streamId, viewerCount);
      })
      .subscribe();
  }

  // Follow/Unfollow Streamers
  async followStreamer(userId: string, streamerId: string): Promise<void> {
    const { error } = await this.supabase
      .from('streamer_follows')
      .insert({
        follower_id: userId,
        streamer_id: streamerId,
        followed_at: new Date().toISOString()
      });

    if (error && error.code !== '23505') throw error; // Ignore duplicate key error
  }

  async unfollowStreamer(userId: string, streamerId: string): Promise<void> {
    const { error } = await this.supabase
      .from('streamer_follows')
      .delete()
      .eq('follower_id', userId)
      .eq('streamer_id', streamerId);

    if (error) throw error;
  }

  async getFollowedStreams(userId: string): Promise<Stream[]> {
    const { data, error } = await this.supabase
      .from('streams')
      .select(`
        *,
        streamer:profiles!streamer_id(username, display_name, avatar_url),
        game:games(id, name, cover_url)
      `)
      .eq('status', 'live')
      .in('streamer_id', 
        this.supabase
          .from('streamer_follows')
          .select('streamer_id')
          .eq('follower_id', userId)
      )
      .order('viewer_count', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}

export const streamManager = new StreamManager();
