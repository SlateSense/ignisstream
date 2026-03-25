"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

export interface Hashtag {
  id: string;
  name: string;
  usage_count: number;
  created_at: string;
  category?: 'gaming' | 'genre' | 'platform' | 'event' | 'general';
  trending_score?: number;
}

export interface HashtagPost {
  id: string;
  hashtag_id: string;
  post_id: string;
  created_at: string;
}

interface HashtagContextType {
  trendingHashtags: Hashtag[];
  recentHashtags: Hashtag[];
  loading: boolean;
  extractHashtags: (text: string) => string[];
  addHashtagsToPost: (postId: string, hashtags: string[]) => Promise<void>;
  getPostsByHashtag: (hashtag: string, limit?: number) => Promise<any[]>;
  searchHashtags: (query: string) => Promise<Hashtag[]>;
  followHashtag: (hashtagId: string) => Promise<void>;
  unfollowHashtag: (hashtagId: string) => Promise<void>;
  getFollowedHashtags: () => Promise<Hashtag[]>;
  loadTrendingHashtags: () => Promise<void>;
  loadRecentHashtags: () => Promise<void>;
}

const HashtagContext = createContext<HashtagContextType | undefined>(undefined);

export const useHashtags = () => {
  const context = useContext(HashtagContext);
  if (!context) {
    throw new Error('useHashtags must be used within a HashtagProvider');
  }
  return context;
};

interface HashtagProviderProps {
  children: ReactNode;
}

// Popular gaming hashtags to suggest
const POPULAR_GAMING_HASHTAGS = [
  '#valorant', '#csgo', '#leagueoflegends', '#fortnite', '#apexlegends',
  '#minecraft', '#genshinimpact', '#overwatch2', '#callofduty', '#fifa',
  '#gaming', '#esports', '#twitch', '#streamer', '#gamer',
  '#fps', '#moba', '#rpg', '#mmo', '#battleroyale',
  '#pcgaming', '#console', '#mobile', '#nintendo', '#playstation', '#xbox',
  '#clutch', '#ace', '#pentakill', '#victory', '#gg', '#poggers'
];

export default function HashtagProvider({ children }: HashtagProviderProps) {
  const [trendingHashtags, setTrendingHashtags] = useState<Hashtag[]>([]);
  const [recentHashtags, setRecentHashtags] = useState<Hashtag[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Don't auto-load hashtags on mount - let components load them when needed
  // This prevents expensive queries from running on every page load

  const loadTrendingHashtags = async () => {
    try {
      const supabase = createClient();
      
      // Calculate trending score based on recent usage
      const { data, error } = await supabase
        .from('hashtags')
        .select(`
          *,
          hashtag_posts!inner(created_at)
        `)
        .gte('hashtag_posts.created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
        .order('usage_count', { ascending: false })
        .limit(20);

      if (error && error.code !== 'PGRST116') { // Ignore "no rows" error
        throw error;
      }

      // Calculate trending scores
      const trending = (data || []).map(hashtag => {
        const recentPosts = hashtag.hashtag_posts?.length || 0;
        const trendingScore = (recentPosts * 10) + (hashtag.usage_count * 0.1);
        return {
          ...hashtag,
          trending_score: trendingScore
        };
      }).sort((a, b) => (b.trending_score || 0) - (a.trending_score || 0));

      setTrendingHashtags(trending.slice(0, 10));
    } catch (error) {
      console.error('Error loading trending hashtags:', error);
      // Set some default trending hashtags if database is empty
      setTrendingHashtags([
        { id: '1', name: 'gaming', usage_count: 150, created_at: new Date().toISOString(), trending_score: 100 },
        { id: '2', name: 'valorant', usage_count: 89, created_at: new Date().toISOString(), trending_score: 95 },
        { id: '3', name: 'esports', usage_count: 76, created_at: new Date().toISOString(), trending_score: 85 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentHashtags = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('hashtags')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(15);

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setRecentHashtags(data || []);
    } catch (error) {
      console.error('Error loading recent hashtags:', error);
    }
  };

  const extractHashtags = (text: string): string[] => {
    const hashtagRegex = /#[a-zA-Z0-9_]+/g;
    const matches = text.match(hashtagRegex);
    
    if (!matches) return [];
    
    return matches
      .map(tag => tag.toLowerCase().slice(1)) // Remove # and convert to lowercase
      .filter((tag, index, array) => array.indexOf(tag) === index) // Remove duplicates
      .filter(tag => tag.length >= 2 && tag.length <= 30); // Valid length
  };

  const addHashtagsToPost = async (postId: string, hashtags: string[]) => {
    if (!user || hashtags.length === 0) return;

    try {
      const supabase = createClient();
      
      // Create or update hashtags
      for (const hashtagName of hashtags) {
        // Check if hashtag exists
        const { data: existingHashtag, error: searchError } = await supabase
          .from('hashtags')
          .select('id, usage_count')
          .eq('name', hashtagName)
          .single();

        let hashtagId: string;

        if (existingHashtag && !searchError) {
          // Update usage count
          hashtagId = existingHashtag.id;
          await supabase
            .from('hashtags')
            .update({ usage_count: existingHashtag.usage_count + 1 })
            .eq('id', hashtagId);
        } else {
          // Create new hashtag
          const category = categorizeHashtag(hashtagName);
          const { data: newHashtag, error: insertError } = await supabase
            .from('hashtags')
            .insert({
              name: hashtagName,
              usage_count: 1,
              category: category
            })
            .select('id')
            .single();

          if (insertError) {
            console.error('Error creating hashtag:', insertError);
            continue;
          }

          hashtagId = newHashtag.id;
        }

        // Link hashtag to post
        await supabase
          .from('hashtag_posts')
          .insert({
            hashtag_id: hashtagId,
            post_id: postId
          });
      }

      // Refresh trending hashtags
      await loadTrendingHashtags();
    } catch (error) {
      console.error('Error adding hashtags to post:', error);
    }
  };

  const categorizeHashtag = (hashtag: string): Hashtag['category'] => {
    const gaming = ['gaming', 'gamer', 'esports', 'twitch', 'streamer', 'gg', 'poggers', 'clutch'];
    const genres = ['fps', 'moba', 'rpg', 'mmo', 'battleroyale', 'strategy', 'racing'];
    const platforms = ['pc', 'console', 'mobile', 'nintendo', 'playstation', 'xbox', 'steam'];
    const events = ['tournament', 'championship', 'competition', 'league'];

    if (gaming.some(word => hashtag.includes(word))) return 'gaming';
    if (genres.some(word => hashtag.includes(word))) return 'genre';
    if (platforms.some(word => hashtag.includes(word))) return 'platform';
    if (events.some(word => hashtag.includes(word))) return 'event';
    
    return 'general';
  };

  const getPostsByHashtag = async (hashtag: string, limit = 20): Promise<any[]> => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('hashtag_posts')
        .select(`
          post:posts(
            id,
            caption,
            created_at,
            visibility,
            author:profiles!author_id(id, username, display_name, avatar_url),
            game:games(id, name, cover_url),
            assets:post_assets(asset:assets(id, type, storage_path, thumbnail_url)),
            likes_count:likes(count),
            comments_count:comments(count)
          )
        `)
        .eq('hashtag.name', hashtag.toLowerCase())
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || [])
        .map(item => item.post)
        .filter(post => post && !Array.isArray(post) && (post as any).visibility === 'public');
    } catch (error) {
      console.error('Error getting posts by hashtag:', error);
      return [];
    }
  };

  const searchHashtags = async (query: string): Promise<Hashtag[]> => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('hashtags')
        .select('*')
        .ilike('name', `%${query.toLowerCase()}%`)
        .order('usage_count', { ascending: false })
        .limit(20);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error searching hashtags:', error);
      return [];
    }
  };

  const followHashtag = async (hashtagId: string) => {
    if (!user) return;

    try {
      const supabase = createClient();
      await supabase
        .from('hashtag_follows')
        .insert({
          user_id: user.id,
          hashtag_id: hashtagId
        });

      toast({
        title: "Hashtag followed",
        description: "You'll see more content from this hashtag in your feed",
      });
    } catch (error) {
      console.error('Error following hashtag:', error);
    }
  };

  const unfollowHashtag = async (hashtagId: string) => {
    if (!user) return;

    try {
      const supabase = createClient();
      await supabase
        .from('hashtag_follows')
        .delete()
        .eq('user_id', user.id)
        .eq('hashtag_id', hashtagId);

      toast({
        title: "Hashtag unfollowed",
        description: "This hashtag has been removed from your feed",
      });
    } catch (error) {
      console.error('Error unfollowing hashtag:', error);
    }
  };

  const getFollowedHashtags = async (): Promise<Hashtag[]> => {
    if (!user) return [];

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('hashtag_follows')
        .select(`
          hashtag:hashtags(*)
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      return (data || []).map(item => item.hashtag).filter((hashtag: any): hashtag is Hashtag => hashtag && typeof hashtag === 'object' && !Array.isArray(hashtag) && hashtag.id).map(hashtag => hashtag as unknown as Hashtag);
    } catch (error) {
      console.error('Error getting followed hashtags:', error);
      return [];
    }
  };

  const value = {
    trendingHashtags,
    recentHashtags,
    loading,
    extractHashtags,
    addHashtagsToPost,
    getPostsByHashtag,
    searchHashtags,
    followHashtag,
    unfollowHashtag,
    getFollowedHashtags,
    loadTrendingHashtags,
    loadRecentHashtags,
  };

  return (
    <HashtagContext.Provider value={value}>
      {children}
    </HashtagContext.Provider>
  );
}
