"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'social' | 'content' | 'gaming' | 'streak' | 'milestone';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
  requirements: {
    type: 'posts' | 'likes' | 'comments' | 'followers' | 'streak' | 'games';
    count: number;
    timeframe?: string; // e.g., "7d", "30d"
  };
  unlock_message: string;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  progress: number;
  max_progress: number;
  achievement: Achievement;
}

interface AchievementContextType {
  achievements: Achievement[];
  userAchievements: UserAchievement[];
  unlockedCount: number;
  totalPoints: number;
  loading: boolean;
  checkAchievements: () => Promise<void>;
  getAchievementProgress: (achievementId: string) => { progress: number; max: number; unlocked: boolean };
  initializeAchievements: () => Promise<void>;
}

const AchievementContext = createContext<AchievementContextType | undefined>(undefined);

export const useAchievements = () => {
  const context = useContext(AchievementContext);
  if (!context) {
    throw new Error('useAchievements must be used within an AchievementProvider');
  }
  return context;
};

// Predefined achievements
const DEFAULT_ACHIEVEMENTS: Omit<Achievement, 'id' | 'created_at'>[] = [
  {
    name: "First Steps",
    description: "Create your first post",
    icon: "🎮",
    category: "content",
    rarity: "common",
    points: 10,
    requirements: { type: "posts", count: 1 },
    unlock_message: "Welcome to IgnisStream! Your gaming journey begins now."
  },
  {
    name: "Content Creator",
    description: "Share 10 gaming moments",
    icon: "📸",
    category: "content",
    rarity: "common",
    points: 50,
    requirements: { type: "posts", count: 10 },
    unlock_message: "You're becoming quite the content creator!"
  },
  {
    name: "Viral Moment",
    description: "Get 100 likes on a single post",
    icon: "🔥",
    category: "social",
    rarity: "rare",
    points: 100,
    requirements: { type: "likes", count: 100 },
    unlock_message: "Your content is on fire! That post really resonated with the community."
  },
  {
    name: "Community Builder",
    description: "Reach 50 followers",
    icon: "👥",
    category: "social",
    rarity: "rare",
    points: 150,
    requirements: { type: "followers", count: 50 },
    unlock_message: "You're building an amazing gaming community!"
  },
  {
    name: "Legendary Creator",
    description: "Share 100 posts",
    icon: "👑",
    category: "content",
    rarity: "epic",
    points: 300,
    requirements: { type: "posts", count: 100 },
    unlock_message: "You've become a legendary content creator! The community loves your posts."
  },
  {
    name: "Gaming Influencer",
    description: "Reach 500 followers",
    icon: "⭐",
    category: "social",
    rarity: "epic",
    points: 500,
    requirements: { type: "followers", count: 500 },
    unlock_message: "You're officially a gaming influencer! Your impact is undeniable."
  },
  {
    name: "Comment King",
    description: "Leave 100 comments",
    icon: "💬",
    category: "social",
    rarity: "common",
    points: 75,
    requirements: { type: "comments", count: 100 },
    unlock_message: "Your engagement with the community is amazing!"
  },
  {
    name: "Week Warrior",
    description: "Post daily for 7 days straight",
    icon: "📅",
    category: "streak",
    rarity: "rare",
    points: 200,
    requirements: { type: "streak", count: 7, timeframe: "7d" },
    unlock_message: "Your dedication to daily content is inspiring!"
  },
  {
    name: "Gaming God",
    description: "Reach 1000 followers",
    icon: "🏆",
    category: "milestone",
    rarity: "legendary",
    points: 1000,
    requirements: { type: "followers", count: 1000 },
    unlock_message: "You've achieved legendary status in the gaming community!"
  },
  {
    name: "Multi-Gamer",
    description: "Post about 10 different games",
    icon: "🎯",
    category: "gaming",
    rarity: "rare",
    points: 150,
    requirements: { type: "games", count: 10 },
    unlock_message: "Your gaming diversity is impressive!"
  }
];

interface AchievementProviderProps {
  children: ReactNode;
}

export default function AchievementProvider({ children }: AchievementProviderProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Don't auto-load achievements on mount - let achievement components load them when needed
  // This prevents multiple database operations from running on every page load
  useEffect(() => {
    if (!user) {
      setUserAchievements([]);
      setLoading(false);
      return;
    }
  }, [user]);

  const initializeAchievements = async () => {
    try {
      const supabase = createClient();
      
      // Check if achievements exist, if not create them
      const { data: existingAchievements, error: fetchError } = await supabase
        .from('achievements')
        .select('*');

      if (fetchError) throw fetchError;

      if (!existingAchievements || existingAchievements.length === 0) {
        // Create default achievements
        const { error: insertError } = await supabase
          .from('achievements')
          .insert(DEFAULT_ACHIEVEMENTS);

        if (insertError) throw insertError;
      }

      // Load all achievements
      await loadAchievements();
      await loadUserAchievements();
    } catch (error) {
      console.error('Error initializing achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAchievements = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('points', { ascending: true });

      if (error) throw error;
      setAchievements(data || []);
    } catch (error) {
      console.error('Error loading achievements:', error);
    }
  };

  const loadUserAchievements = async () => {
    if (!user) return;

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievement:achievements(*)
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      const processedAchievements = (data || []).map(ua => ({
        ...ua,
        achievement: Array.isArray(ua.achievement) ? ua.achievement[0] : ua.achievement
      }));

      setUserAchievements(processedAchievements);
    } catch (error) {
      console.error('Error loading user achievements:', error);
    }
  };

  const checkAchievements = async () => {
    if (!user) return;

    try {
      const supabase = createClient();

      // Get user stats
      const [
        { count: postsCount },
        { count: commentsCount },
        { data: followersData },
        { data: postsWithGames }
      ] = await Promise.all([
        supabase
          .from('posts')
          .select('id', { count: 'exact', head: true })
          .eq('author_id', user.id),
        supabase
          .from('comments')
          .select('id', { count: 'exact', head: true })
          .eq('author_id', user.id),
        supabase
          .from('follows')
          .select('follower_id', { count: 'exact' })
          .eq('following_id', user.id),
        supabase
          .from('posts')
          .select('game_id')
          .eq('author_id', user.id)
          .not('game_id', 'is', null)
      ]);

      const followersCount = followersData?.length || 0;
      const uniqueGamesCount = new Set(postsWithGames?.map(p => p.game_id)).size;

      // Check each achievement
      for (const achievement of achievements) {
        const existingAchievement = userAchievements.find(ua => ua.achievement_id === achievement.id);
        
        if (existingAchievement?.unlocked_at) continue; // Already unlocked

        let currentProgress = 0;
        let shouldUnlock = false;

        switch (achievement.requirements.type) {
          case 'posts':
            currentProgress = postsCount || 0;
            shouldUnlock = currentProgress >= achievement.requirements.count;
            break;
          case 'comments':
            currentProgress = commentsCount || 0;
            shouldUnlock = currentProgress >= achievement.requirements.count;
            break;
          case 'followers':
            currentProgress = followersCount;
            shouldUnlock = currentProgress >= achievement.requirements.count;
            break;
          case 'games':
            currentProgress = uniqueGamesCount;
            shouldUnlock = currentProgress >= achievement.requirements.count;
            break;
          case 'likes':
            // This would need to be checked per post for "Viral Moment" achievement
            const { data: likesData } = await supabase
              .from('posts')
              .select('id, likes_count:likes(count)')
              .eq('author_id', user.id);
            
            const maxLikes = Math.max(...(likesData?.map((p: any) => p.likes_count || 0) || [0]));
            currentProgress = maxLikes;
            shouldUnlock = currentProgress >= achievement.requirements.count;
            break;
        }

        // Update or create user achievement record
        if (existingAchievement) {
          // Update progress
          await supabase
            .from('user_achievements')
            .update({ 
              progress: currentProgress,
              unlocked_at: shouldUnlock ? new Date().toISOString() : existingAchievement.unlocked_at
            })
            .eq('id', existingAchievement.id);
        } else {
          // Create new achievement record
          await supabase
            .from('user_achievements')
            .insert({
              user_id: user.id,
              achievement_id: achievement.id,
              progress: currentProgress,
              max_progress: achievement.requirements.count,
              unlocked_at: shouldUnlock ? new Date().toISOString() : null
            });
        }

        // Show unlock notification
        if (shouldUnlock && !existingAchievement?.unlocked_at) {
          toast({
            title: `🎉 Achievement Unlocked!`,
            description: `${achievement.icon} ${achievement.name} - ${achievement.unlock_message}`,
          });

          // Create notification
          await supabase
            .from('notifications')
            .insert({
              type: 'achievement',
              actor_id: user.id,
              recipient_id: user.id,
              achievement_id: achievement.id
            });
        }
      }

      // Reload user achievements
      await loadUserAchievements();
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  };

  const getAchievementProgress = (achievementId: string) => {
    const userAchievement = userAchievements.find(ua => ua.achievement_id === achievementId);
    const achievement = achievements.find(a => a.id === achievementId);
    
    return {
      progress: userAchievement?.progress || 0,
      max: achievement?.requirements.count || 0,
      unlocked: !!userAchievement?.unlocked_at
    };
  };

  const unlockedCount = userAchievements.filter(ua => ua.unlocked_at).length;
  const totalPoints = userAchievements
    .filter(ua => ua.unlocked_at)
    .reduce((sum, ua) => sum + (ua.achievement?.points || 0), 0);

  const value = {
    achievements,
    userAchievements,
    unlockedCount,
    totalPoints,
    loading,
    checkAchievements,
    getAchievementProgress,
    initializeAchievements, // Expose this so components can initialize when needed
  };

  return (
    <AchievementContext.Provider value={value}>
      {children}
    </AchievementContext.Provider>
  );
}
