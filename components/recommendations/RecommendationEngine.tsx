"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserPreferences {
  favoriteGames: string[];
  preferredGenres: string[];
  skillLevel: string;
  playstyle: string[];
  contentTypes: string[];
  followedHashtags: string[];
  recentInteractions: Array<{
    type: 'like' | 'comment' | 'share' | 'view';
    contentId: string;
    gameId?: string;
    timestamp: string;
  }>;
}

export interface RecommendationItem {
  id: string;
  type: 'post' | 'user' | 'game' | 'stream' | 'hashtag';
  score: number;
  reason: string;
  data: any;
}

interface RecommendationContextType {
  recommendations: RecommendationItem[];
  userPreferences: UserPreferences | null;
  loading: boolean;
  refreshRecommendations: () => Promise<void>;
  getRecommendationsByType: (type: string) => RecommendationItem[];
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
  recordInteraction: (interaction: any) => Promise<void>;
}

const RecommendationContext = createContext<RecommendationContextType | undefined>(undefined);

export const useRecommendations = () => {
  const context = useContext(RecommendationContext);
  if (!context) {
    throw new Error('useRecommendations must be used within a RecommendationProvider');
  }
  return context;
};

interface RecommendationProviderProps {
  children: ReactNode;
}

export default function RecommendationProvider({ children }: RecommendationProviderProps) {
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadUserPreferences();
      generateRecommendations();
    }
  }, [user]);

  const loadUserPreferences = async () => {
    if (!user) return;

    try {
      const supabase = createClient();

      // Get user's gaming preferences
      const { data: profile } = await supabase
        .from('profiles')
        .select('gaming_preferences')
        .eq('id', user.id)
        .single();

      // Get user's liked posts to understand preferences
      const { data: likes } = await supabase
        .from('likes')
        .select(`
          post:posts(id, game_id),
          created_at
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      // Get user's comments for interaction data
      const { data: comments } = await supabase
        .from('comments')
        .select(`
          post:posts(id, game_id),
          created_at
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      // Get followed hashtags
      const { data: followedHashtags } = await supabase
        .from('hashtag_follows')
        .select(`
          hashtag:hashtags(name)
        `)
        .eq('user_id', user.id);

      // Process interactions
      const recentInteractions = [
        ...(likes || []).map(like => ({
          type: 'like' as const,
          contentId: like.post.id,
          gameId: like.post.game_id,
          timestamp: like.created_at
        })),
        ...(comments || []).map(comment => ({
          type: 'comment' as const,
          contentId: comment.post.id,
          gameId: comment.post.game_id,
          timestamp: comment.created_at
        }))
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Extract favorite games from interactions
      const gameInteractions = recentInteractions.reduce((acc, interaction) => {
        if (interaction.gameId) {
          acc[interaction.gameId] = (acc[interaction.gameId] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const favoriteGames = Object.entries(gameInteractions)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([gameId]) => gameId);

      const preferences: UserPreferences = {
        favoriteGames,
        preferredGenres: profile?.gaming_preferences?.favorite_genres || [],
        skillLevel: profile?.gaming_preferences?.skill_level || 'intermediate',
        playstyle: profile?.gaming_preferences?.playstyle || ['casual'],
        contentTypes: ['video', 'image', 'post'],
        followedHashtags: (followedHashtags || []).map(fh => fh.hashtag.name),
        recentInteractions: recentInteractions.slice(0, 20)
      };

      setUserPreferences(preferences);
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
  };

  const generateRecommendations = async () => {
    if (!user || !userPreferences) return;

    setLoading(true);
    try {
      const supabase = createClient();
      const recommendations: RecommendationItem[] = [];

      // 1. Content-based recommendations (similar games)
      if (userPreferences.favoriteGames.length > 0) {
        const { data: similarPosts } = await supabase
          .from('posts')
          .select(`
            id, caption, created_at, visibility,
            author:profiles!author_id(id, username, display_name, avatar_url),
            game:games(id, name, cover_url, genre),
            assets:post_assets(asset:assets(id, type, storage_path, thumbnail_url)),
            likes_count:likes(count),
            comments_count:comments(count)
          `)
          .in('game_id', userPreferences.favoriteGames)
          .eq('visibility', 'public')
          .neq('author_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        similarPosts?.forEach(post => {
          recommendations.push({
            id: `post-${post.id}`,
            type: 'post',
            score: calculateContentScore(post, userPreferences),
            reason: `Based on your interest in ${post.game?.name}`,
            data: post
          });
        });
      }

      // 2. Collaborative filtering (users with similar tastes)
      const { data: similarUsers } = await supabase
        .from('likes')
        .select('user_id')
        .in('post_id', userPreferences.recentInteractions.map(i => i.contentId))
        .neq('user_id', user.id);

      if (similarUsers && similarUsers.length > 0) {
        const userIds = [...new Set(similarUsers.map(u => u.user_id))].slice(0, 5);
        
        const { data: similarUserPosts } = await supabase
          .from('posts')
          .select(`
            id, caption, created_at, visibility,
            author:profiles!author_id(id, username, display_name, avatar_url),
            game:games(id, name, cover_url),
            assets:post_assets(asset:assets(id, type, storage_path, thumbnail_url)),
            likes_count:likes(count),
            comments_count:comments(count)
          `)
          .in('author_id', userIds)
          .eq('visibility', 'public')
          .neq('author_id', user.id)
          .order('created_at', { ascending: false })
          .limit(8);

        similarUserPosts?.forEach(post => {
          recommendations.push({
            id: `collab-${post.id}`,
            type: 'post',
            score: calculateCollaborativeScore(post, userPreferences),
            reason: 'Users with similar taste also liked this',
            data: post
          });
        });
      }

      // 3. Trending content in user's favorite games
      if (userPreferences.favoriteGames.length > 0) {
        const { data: trendingInFavorites } = await supabase
          .from('posts')
          .select(`
            id, caption, created_at, visibility,
            author:profiles!author_id(id, username, display_name, avatar_url),
            game:games(id, name, cover_url),
            assets:post_assets(asset:assets(id, type, storage_path, thumbnail_url)),
            likes_count:likes(count),
            comments_count:comments(count)
          `)
          .in('game_id', userPreferences.favoriteGames)
          .eq('visibility', 'public')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
          .order('created_at', { ascending: false })
          .limit(5);

        trendingInFavorites?.forEach(post => {
          const engagementScore = (post.likes_count?.length || 0) + (post.comments_count?.length || 0) * 2;
          if (engagementScore > 5) { // Only highly engaged content
            recommendations.push({
              id: `trending-${post.id}`,
              type: 'post',
              score: engagementScore * 0.1 + 8, // Boost trending content
              reason: `Trending in ${post.game?.name}`,
              data: post
            });
          }
        });
      }

      // 4. User recommendations (follow suggestions)
      const { data: activeUsers } = await supabase
        .from('profiles')
        .select(`
          id, username, display_name, avatar_url, bio,
          posts:posts(count),
          followers:follows!following_id(count)
        `)
        .neq('id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      activeUsers?.forEach(user => {
        const postCount = user.posts?.length || 0;
        const followerCount = user.followers?.length || 0;
        if (postCount > 3 && followerCount > 5) { // Active users
          recommendations.push({
            id: `user-${user.id}`,
            type: 'user',
            score: Math.min(postCount * 0.5 + followerCount * 0.1, 10),
            reason: 'Active content creator you might like',
            data: user
          });
        }
      });

      // 5. New games based on preferred genres
      if (userPreferences.preferredGenres.length > 0) {
        const { data: newGames } = await supabase
          .from('games')
          .select('id, name, description, cover_url, genre, release_date')
          .overlaps('genre', userPreferences.preferredGenres)
          .order('release_date', { ascending: false })
          .limit(5);

        newGames?.forEach(game => {
          recommendations.push({
            id: `game-${game.id}`,
            type: 'game',
            score: 7,
            reason: `New ${game.genre?.join(', ')} game`,
            data: game
          });
        });
      }

      // Sort by score and limit
      const sortedRecommendations = recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, 50);

      setRecommendations(sortedRecommendations);
    } catch (error) {
      console.error('Error generating recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateContentScore = (post: any, preferences: UserPreferences): number => {
    let score = 5; // Base score

    // Game preference bonus
    if (preferences.favoriteGames.includes(post.game_id)) {
      score += 3;
    }

    // Engagement bonus
    const engagement = (post.likes_count?.length || 0) + (post.comments_count?.length || 0);
    score += Math.min(engagement * 0.1, 2);

    // Recency bonus
    const hoursOld = (Date.now() - new Date(post.created_at).getTime()) / (1000 * 60 * 60);
    if (hoursOld < 24) score += 1;
    if (hoursOld < 6) score += 1;

    // Content type preference
    const hasVideo = post.assets?.some((a: any) => a.asset?.type === 'video');
    const hasImage = post.assets?.some((a: any) => a.asset?.type === 'image');
    
    if (hasVideo && preferences.contentTypes.includes('video')) score += 1;
    if (hasImage && preferences.contentTypes.includes('image')) score += 0.5;

    return Math.min(score, 10);
  };

  const calculateCollaborativeScore = (post: any, preferences: UserPreferences): number => {
    let score = 6; // Base collaborative score

    // Similar game bonus
    if (preferences.favoriteGames.includes(post.game_id)) {
      score += 2;
    }

    // Engagement factor
    const engagement = (post.likes_count?.length || 0) + (post.comments_count?.length || 0);
    score += Math.min(engagement * 0.05, 1);

    return Math.min(score, 10);
  };

  const refreshRecommendations = async () => {
    await loadUserPreferences();
    await generateRecommendations();
  };

  const getRecommendationsByType = (type: string): RecommendationItem[] => {
    return recommendations.filter(rec => rec.type === type);
  };

  const updatePreferences = async (newPreferences: Partial<UserPreferences>) => {
    if (!user || !userPreferences) return;

    try {
      const supabase = createClient();
      const updatedPreferences = { ...userPreferences, ...newPreferences };

      // Update gaming preferences in profile
      await supabase
        .from('profiles')
        .update({
          gaming_preferences: {
            favorite_genres: updatedPreferences.preferredGenres,
            skill_level: updatedPreferences.skillLevel,
            playstyle: updatedPreferences.playstyle
          }
        })
        .eq('id', user.id);

      setUserPreferences(updatedPreferences);
      await generateRecommendations();
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  };

  const recordInteraction = async (interaction: any) => {
    if (!user || !userPreferences) return;

    try {
      // Add to local state immediately
      const newInteraction = {
        ...interaction,
        timestamp: new Date().toISOString()
      };

      const updatedInteractions = [
        newInteraction,
        ...userPreferences.recentInteractions.slice(0, 19)
      ];

      setUserPreferences({
        ...userPreferences,
        recentInteractions: updatedInteractions
      });

      // Periodically refresh recommendations based on new interactions
      if (updatedInteractions.length % 5 === 0) {
        await generateRecommendations();
      }
    } catch (error) {
      console.error('Error recording interaction:', error);
    }
  };

  const value = {
    recommendations,
    userPreferences,
    loading,
    refreshRecommendations,
    getRecommendationsByType,
    updatePreferences,
    recordInteraction,
  };

  return (
    <RecommendationContext.Provider value={value}>
      {children}
    </RecommendationContext.Provider>
  );
}
