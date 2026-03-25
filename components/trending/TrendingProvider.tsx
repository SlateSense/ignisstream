"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface TrendingPost {
  id: string;
  caption: string;
  created_at: string;
  visibility: string;
  trending_score: number;
  author: {
    id: string;
    username: string;
    display_name: string;
    avatar_url?: string;
    follower_count?: number;
  };
  game?: {
    id: string;
    name: string;
    cover_url?: string;
  };
  assets: Array<{
    asset: {
      id: string;
      type: string;
      storage_path: string;
      thumbnail_url?: string;
    };
  }>;
  likes_count: number;
  comments_count: number;
  engagement_rate: number;
  velocity: number; // How fast it's gaining engagement
}

interface TrendingContextType {
  trendingPosts: TrendingPost[];
  trendingGames: any[];
  trendingHashtags: any[];
  loading: boolean;
  refreshTrending: () => Promise<void>;
  getTrendingByGame: (gameId: string) => Promise<TrendingPost[]>;
  calculateTrendingScore: (post: any) => number;
}

const TrendingContext = createContext<TrendingContextType | undefined>(undefined);

export const useTrending = () => {
  const context = useContext(TrendingContext);
  if (!context) {
    throw new Error('useTrending must be used within a TrendingProvider');
  }
  return context;
};

interface TrendingProviderProps {
  children: ReactNode;
}

export default function TrendingProvider({ children }: TrendingProviderProps) {
  const [trendingPosts, setTrendingPosts] = useState<TrendingPost[]>([]);
  const [trendingGames, setTrendingGames] = useState<any[]>([]);
  const [trendingHashtags, setTrendingHashtags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    // Delay loading to avoid blocking initial render
    const timer = setTimeout(() => {
      loadTrendingContent();
    }, 500);
    
    // Set up interval to refresh trending content every 10 minutes
    const interval = setInterval(loadTrendingContent, 10 * 60 * 1000);
    
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  const calculateTrendingScore = (post: any): number => {
    const now = new Date();
    const createdAt = new Date(post.created_at);
    const ageInHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    
    // Prevent division by zero
    const ageInHoursAdjusted = Math.max(ageInHours, 0.1);
    
    // Base engagement metrics
    const likes = post.likes_count || 0;
    const comments = post.comments_count || 0;
    const views = post.views || 0; // If you track views
    
    // Weights for different engagement types
    const likeWeight = 1;
    const commentWeight = 3; // Comments are more valuable than likes
    const viewWeight = 0.1;
    
    // Calculate base engagement score
    const engagementScore = (likes * likeWeight) + (comments * commentWeight) + (views * viewWeight);
    
    // Time decay factor - newer posts get higher scores
    const timeDecayFactor = Math.pow(0.8, ageInHours / 24); // Decay over days
    
    // Velocity bonus - posts gaining engagement quickly get boosted
    const velocityBonus = engagementScore / ageInHoursAdjusted; // Engagement per hour
    
    // Author factor - verified or popular creators get small boost
    const authorBonus = post.author?.follower_count > 1000 ? 1.2 : 1.0;
    
    // Content type bonus
    const hasVideo = post.assets?.some((asset: any) => asset.asset?.type === 'video') ? 1.3 : 1.0;
    const hasImage = post.assets?.some((asset: any) => asset.asset?.type === 'image') ? 1.1 : 1.0;
    
    // Final trending score calculation
    const trendingScore = engagementScore * timeDecayFactor * authorBonus * hasVideo * hasImage + velocityBonus;
    
    return Math.round(trendingScore * 100) / 100;
  };

  const loadTrendingContent = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadTrendingPosts(),
        loadTrendingGames(),
        loadTrendingHashtags()
      ]);
    } catch (error) {
      console.error('Error loading trending content:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTrendingPosts = async () => {
    try {
      const supabase = createClient();
      
      // Get posts from last 7 days with engagement data
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          caption,
          created_at,
          visibility,
          author:profiles!author_id(
            id, 
            username, 
            display_name, 
            avatar_url,
            follower_count:follows!following_id(count)
          ),
          game:games(id, name, cover_url),
          assets:post_assets(asset:assets(id, type, storage_path, thumbnail_url)),
          likes_count:likes(count),
          comments_count:comments(count)
        `)
        .eq('visibility', 'public')
        .gte('created_at', sevenDaysAgo)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Calculate trending scores for each post
      const postsWithScores = (data || []).map(post => {
        // Process nested data - handle arrays from Supabase relations
        const author = Array.isArray(post.author) ? post.author[0] : post.author;
        const game = Array.isArray(post.game) ? post.game[0] : post.game;
        
        const processedPost: TrendingPost = {
          ...post,
          author: Array.isArray(author) ? {
            id: author[0]?.id || '',
            username: author[0]?.username || '',
            display_name: author[0]?.display_name || '',
            avatar_url: author[0]?.avatar_url,
            follower_count: Array.isArray(author[0]?.follower_count) ? author[0].follower_count.length : author[0]?.follower_count || 0
          } : {
            id: author?.id || '',
            username: author?.username || '',
            display_name: author?.display_name || '',
            avatar_url: author?.avatar_url,
            follower_count: Array.isArray(author?.follower_count) ? author.follower_count.length : author?.follower_count || 0
          },
          game: game,
          assets: (post.assets || []).map((assetItem: any) => ({
            asset: Array.isArray(assetItem.asset) ? assetItem.asset[0] : assetItem.asset
          })),
          likes_count: Array.isArray(post.likes_count) ? post.likes_count.length : post.likes_count || 0,
          comments_count: Array.isArray(post.comments_count) ? post.comments_count.length : post.comments_count || 0,
          trending_score: 0, // Will be calculated below
          engagement_rate: 0, // Will be calculated below
          velocity: 0 // Will be calculated below
        };

        const trendingScore = calculateTrendingScore(processedPost);
        const engagementRate = processedPost.likes_count + processedPost.comments_count;
        
        // Calculate velocity (engagement per hour since creation)
        const ageInHours = (Date.now() - new Date(processedPost.created_at).getTime()) / (1000 * 60 * 60);
        const velocity = engagementRate / Math.max(ageInHours, 0.1);

        return {
          ...processedPost,
          trending_score: trendingScore,
          engagement_rate: engagementRate,
          velocity: velocity
        };
      });

      // Sort by trending score and take top posts
      const trending = postsWithScores
        .sort((a, b) => b.trending_score - a.trending_score)
        .slice(0, 20);

      setTrendingPosts(trending);
    } catch (error) {
      console.error('Error loading trending posts:', error);
      setTrendingPosts([]);
    }
  };

  const loadTrendingGames = async () => {
    try {
      const supabase = createClient();
      
      // Get games with most posts in last 7 days
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('games')
        .select(`
          id,
          name,
          cover_url,
          posts!inner(
            id,
            created_at,
            likes:likes(count),
            comments:comments(count)
          )
        `)
        .gte('posts.created_at', sevenDaysAgo)
        .order('posts(count)', { ascending: false })
        .limit(10);

      if (error && error.code !== 'PGRST116') throw error;

      // Calculate trending scores for games
      const gamesWithScores = (data || []).map(game => {
        const posts = game.posts || [];
        const totalEngagement = posts.reduce((sum: number, post: any) => {
          return sum + (post.likes?.length || 0) + (post.comments?.length || 0);
        }, 0);

        return {
          ...game,
          post_count: posts.length,
          total_engagement: totalEngagement,
          trending_score: posts.length * 10 + totalEngagement
        };
      });

      setTrendingGames(gamesWithScores.slice(0, 8));
    } catch (error) {
      console.error('Error loading trending games:', error);
      setTrendingGames([]);
    }
  };

  const loadTrendingHashtags = async () => {
    try {
      const supabase = createClient();
      
      // Get hashtags with most usage in last 7 days
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('hashtags')
        .select(`
          id,
          name,
          usage_count,
          hashtag_posts!inner(
            created_at,
            post:posts(
              likes:likes(count),
              comments:comments(count)
            )
          )
        `)
        .gte('hashtag_posts.created_at', sevenDaysAgo)
        .order('usage_count', { ascending: false })
        .limit(15);

      if (error && error.code !== 'PGRST116') throw error;

      // Calculate trending scores for hashtags
      const hashtagsWithScores = (data || []).map(hashtag => {
        const recentUsage = hashtag.hashtag_posts?.length || 0;
        const totalEngagement = hashtag.hashtag_posts?.reduce((sum: number, hp: any) => {
          const post = hp.post;
          return sum + (post?.likes?.length || 0) + (post?.comments?.length || 0);
        }, 0) || 0;

        return {
          ...hashtag,
          recent_usage: recentUsage,
          trending_score: recentUsage * 5 + totalEngagement * 0.1
        };
      });

      setTrendingHashtags(hashtagsWithScores.slice(0, 10));
    } catch (error) {
      console.error('Error loading trending hashtags:', error);
      setTrendingHashtags([]);
    }
  };

  const getTrendingByGame = async (gameId: string): Promise<TrendingPost[]> => {
    try {
      const supabase = createClient();
      
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          caption,
          created_at,
          visibility,
          author:profiles!author_id(id, username, display_name, avatar_url),
          game:games(id, name, cover_url),
          assets:post_assets(asset:assets(id, type, storage_path, thumbnail_url)),
          likes_count:likes(count),
          comments_count:comments(count)
        `)
        .eq('game_id', gameId)
        .eq('visibility', 'public')
        .gte('created_at', sevenDaysAgo)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Calculate trending scores
      const postsWithScores = (data || []).map(post => {
        const author = Array.isArray(post.author) ? post.author[0] : post.author;
        const game = Array.isArray(post.game) ? post.game[0] : post.game;
        
        const processedPost: TrendingPost = {
          ...post,
          author: {
            id: author?.id || '',
            username: author?.username || '',
            display_name: author?.display_name || '',
            avatar_url: author?.avatar_url,
            follower_count: (author as any)?.follower_count || 0
          },
          game: game,
          assets: (post.assets || []).map((assetItem: any) => ({
            asset: Array.isArray(assetItem.asset) ? assetItem.asset[0] : assetItem.asset
          })),
          likes_count: Array.isArray(post.likes_count) ? post.likes_count.length : post.likes_count || 0,
          comments_count: Array.isArray(post.comments_count) ? post.comments_count.length : post.comments_count || 0,
          trending_score: 0,
          engagement_rate: 0,
          velocity: 0
        };

        const trendingScore = calculateTrendingScore(processedPost);
        const engagementRate = processedPost.likes_count + processedPost.comments_count;
        const ageInHours = (Date.now() - new Date(processedPost.created_at).getTime()) / (1000 * 60 * 60);
        const velocity = engagementRate / Math.max(ageInHours, 0.1);

        return {
          ...processedPost,
          trending_score: trendingScore,
          engagement_rate: engagementRate,
          velocity: velocity
        };
      });

      return postsWithScores
        .sort((a, b) => b.trending_score - a.trending_score)
        .slice(0, 20);
    } catch (error) {
      console.error('Error getting trending posts by game:', error);
      return [];
    }
  };

  const refreshTrending = async () => {
    await loadTrendingContent();
  };

  const value = {
    trendingPosts,
    trendingGames,
    trendingHashtags,
    loading,
    refreshTrending,
    getTrendingByGame,
    calculateTrendingScore,
  };

  return (
    <TrendingContext.Provider value={value}>
      {children}
    </TrendingContext.Provider>
  );
}
