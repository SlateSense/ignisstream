export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          forge_points: number
          premium_status: boolean
          gaming_accounts: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          forge_points?: number
          premium_status?: boolean
          gaming_accounts?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          forge_points?: number
          premium_status?: boolean
          gaming_accounts?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      games: {
        Row: {
          id: number
          slug: string
          name: string
          platforms: string[] | null
          cover_url: string | null
          created_at: string
        }
        Insert: {
          id?: number
          slug: string
          name: string
          platforms?: string[] | null
          cover_url?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          slug?: string
          name?: string
          platforms?: string[] | null
          cover_url?: string | null
          created_at?: string
        }
      }
      posts: {
        Row: {
          id: number
          author_id: string
          game_id: number | null
          caption: string | null
          visibility: 'public' | 'followers' | 'private'
          engagement_score: number
          like_count: number
          comment_count: number
          repost_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          author_id: string
          game_id?: number | null
          caption?: string | null
          visibility?: 'public' | 'followers' | 'private'
          engagement_score?: number
          like_count?: number
          comment_count?: number
          repost_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          author_id?: string
          game_id?: number | null
          caption?: string | null
          visibility?: 'public' | 'followers' | 'private'
          engagement_score?: number
          like_count?: number
          comment_count?: number
          repost_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      assets: {
        Row: {
          id: number
          type: 'image' | 'video'
          storage_path: string | null
          mux_asset_id: string | null
          mux_playback_id: string | null
          thumbnail_url: string | null
          duration_s: number | null
          width: number | null
          height: number | null
          status: 'pending' | 'ready' | 'error'
          created_at: string
        }
        Insert: {
          id?: number
          type: 'image' | 'video'
          storage_path?: string | null
          mux_asset_id?: string | null
          mux_playback_id?: string | null
          thumbnail_url?: string | null
          duration_s?: number | null
          width?: number | null
          height?: number | null
          status?: 'pending' | 'ready' | 'error'
          created_at?: string
        }
        Update: {
          id?: number
          type?: 'image' | 'video'
          storage_path?: string | null
          mux_asset_id?: string | null
          mux_playback_id?: string | null
          thumbnail_url?: string | null
          duration_s?: number | null
          width?: number | null
          height?: number | null
          status?: 'pending' | 'ready' | 'error'
          created_at?: string
        }
      }
      post_assets: {
        Row: {
          post_id: number
          asset_id: number
          sort_order: number
        }
        Insert: {
          post_id: number
          asset_id: number
          sort_order?: number
        }
        Update: {
          post_id?: number
          asset_id?: number
          sort_order?: number
        }
      }
      comments: {
        Row: {
          id: number
          post_id: number
          author_id: string
          body: string
          created_at: string
        }
        Insert: {
          id?: number
          post_id: number
          author_id: string
          body: string
          created_at?: string
        }
        Update: {
          id?: number
          post_id?: number
          author_id?: string
          body?: string
          created_at?: string
        }
      }
      likes: {
        Row: {
          post_id: number
          user_id: string
          created_at: string
        }
        Insert: {
          post_id: number
          user_id: string
          created_at?: string
        }
        Update: {
          post_id?: number
          user_id?: string
          created_at?: string
        }
      }
      follows: {
        Row: {
          follower_id: string
          followed_id: string
          created_at: string
        }
        Insert: {
          follower_id: string
          followed_id: string
          created_at?: string
        }
        Update: {
          follower_id?: string
          followed_id?: string
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: number
          user_id: string
          type: 'like' | 'comment' | 'follow' | 'repost' | 'mention'
          actor_id: string
          post_id: number | null
          comment_id: number | null
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          type: 'like' | 'comment' | 'follow' | 'repost' | 'mention'
          actor_id: string
          post_id?: number | null
          comment_id?: number | null
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          type?: 'like' | 'comment' | 'follow' | 'repost' | 'mention'
          actor_id?: string
          post_id?: number | null
          comment_id?: number | null
          read_at?: string | null
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: number
          conversation_id: string
          sender_id: string
          recipient_id: string
          content: string
          type: 'text' | 'image' | 'video' | 'file'
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: number
          conversation_id: string
          sender_id: string
          recipient_id: string
          content: string
          type?: 'text' | 'image' | 'video' | 'file'
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          conversation_id?: string
          sender_id?: string
          recipient_id?: string
          content?: string
          type?: 'text' | 'image' | 'video' | 'file'
          read_at?: string | null
          created_at?: string
        }
      }
      servers: {
        Row: {
          id: number
          name: string
          description: string | null
          icon_url: string | null
          owner_id: string
          game_id: number | null
          member_count: number
          is_public: boolean
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          description?: string | null
          icon_url?: string | null
          owner_id: string
          game_id?: number | null
          member_count?: number
          is_public?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          description?: string | null
          icon_url?: string | null
          owner_id?: string
          game_id?: number | null
          member_count?: number
          is_public?: boolean
          created_at?: string
        }
      }
      server_members: {
        Row: {
          server_id: number
          user_id: string
          role: 'owner' | 'admin' | 'moderator' | 'member'
          joined_at: string
        }
        Insert: {
          server_id: number
          user_id: string
          role?: 'owner' | 'admin' | 'moderator' | 'member'
          joined_at?: string
        }
        Update: {
          server_id?: number
          user_id?: string
          role?: 'owner' | 'admin' | 'moderator' | 'member'
          joined_at?: string
        }
      }
      forge_points_history: {
        Row: {
          id: number
          user_id: string
          points: number
          reason: string
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          points: number
          reason: string
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          points?: number
          reason?: string
          created_at?: string
        }
      }
      achievements: {
        Row: {
          id: number
          name: string
          description: string
          icon_url: string | null
          points_reward: number
          rarity: 'common' | 'rare' | 'epic' | 'legendary'
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          description: string
          icon_url?: string | null
          points_reward?: number
          rarity?: 'common' | 'rare' | 'epic' | 'legendary'
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          description?: string
          icon_url?: string | null
          points_reward?: number
          rarity?: 'common' | 'rare' | 'epic' | 'legendary'
          created_at?: string
        }
      }
      user_achievements: {
        Row: {
          user_id: string
          achievement_id: number
          earned_at: string
        }
        Insert: {
          user_id: string
          achievement_id: number
          earned_at?: string
        }
        Update: {
          user_id?: string
          achievement_id?: number
          earned_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
