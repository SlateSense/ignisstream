-- ====================================
-- IGNISSTREAM FIXED DATABASE SETUP
-- ====================================
-- Run this entire script in your Supabase SQL Editor
-- ALL DATA TYPES ARE NOW CONSISTENT (UUID)

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================
-- 1. CORE TABLES (FOUNDATION)
-- ====================================

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  email TEXT,
  location TEXT,
  website TEXT,
  twitter TEXT,
  discord TEXT,
  twitch TEXT,
  youtube TEXT,
  steam TEXT,
  privacy_settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 20),
  CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_]+$')
);

-- Create games table
CREATE TABLE IF NOT EXISTS games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  platforms TEXT[],
  cover_url TEXT,
  steam_app_id INTEGER,
  epic_app_id VARCHAR(50),
  xbox_product_id VARCHAR(50),
  playstation_product_id VARCHAR(50),
  platform VARCHAR(20) DEFAULT 'multi',
  developer VARCHAR(200),
  publisher VARCHAR(200),
  release_date DATE,
  metacritic_score INTEGER,
  esrb_rating VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL
);

-- ====================================
-- 2. SOCIAL MEDIA TABLES
-- ====================================

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_url TEXT,
  media_type VARCHAR(10) CHECK (media_type IN ('image', 'video')),
  game_id UUID REFERENCES games(id) ON DELETE SET NULL,
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'followers', 'private')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create post_likes table
CREATE TABLE IF NOT EXISTS post_likes (
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

-- Create bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

-- Create follows table
CREATE TABLE IF NOT EXISTS follows (
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

-- ====================================
-- 3. STREAMING TABLES
-- ====================================

-- Streams table
CREATE TABLE IF NOT EXISTS streams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  game_id UUID REFERENCES games(id),
  streamer_id UUID REFERENCES profiles(id) NOT NULL,
  status VARCHAR(20) DEFAULT 'offline' CHECK (status IN ('live', 'offline', 'ended')),
  viewer_count INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  thumbnail_url TEXT,
  stream_key VARCHAR(100) UNIQUE NOT NULL,
  rtmp_url TEXT NOT NULL,
  hls_url TEXT,
  category VARCHAR(50) NOT NULL,
  tags TEXT[] DEFAULT '{}',
  is_mature BOOLEAN DEFAULT false,
  max_viewers INTEGER DEFAULT 0,
  total_watch_time INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Stream chat table
CREATE TABLE IF NOT EXISTS stream_chat (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_id UUID REFERENCES streams(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  username VARCHAR(50) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  message TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT now(),
  is_moderator BOOLEAN DEFAULT false,
  is_subscriber BOOLEAN DEFAULT false,
  badges TEXT[] DEFAULT '{}'
);

-- ====================================
-- 4. GAMING INTEGRATION TABLES
-- ====================================

-- User connected gaming accounts
CREATE TABLE IF NOT EXISTS user_game_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  platform VARCHAR(20) NOT NULL CHECK (platform IN ('steam', 'epic', 'xbox', 'playstation', 'nintendo', 'gog', 'riot', 'battle_net')),
  platform_user_id VARCHAR(100) NOT NULL,
  platform_username VARCHAR(100) NOT NULL,
  profile_data JSONB DEFAULT '{}',
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  connected_at TIMESTAMPTZ DEFAULT now(),
  disconnected_at TIMESTAMPTZ,
  last_sync TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, platform)
);

-- User game statistics
CREATE TABLE IF NOT EXISTS user_game_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE NOT NULL,
  platform VARCHAR(20) NOT NULL,
  total_playtime INTEGER DEFAULT 0, -- minutes
  achievements_unlocked INTEGER DEFAULT 0,
  total_achievements INTEGER DEFAULT 0,
  last_played TIMESTAMPTZ,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  rank VARCHAR(50),
  matches_played INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  kd_ratio DECIMAL(5,2) DEFAULT 0,
  win_rate DECIMAL(5,2) DEFAULT 0,
  total_kills INTEGER DEFAULT 0,
  total_deaths INTEGER DEFAULT 0,
  total_assists INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, game_id, platform)
);

-- Match history
CREATE TABLE IF NOT EXISTS match_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE NOT NULL,
  match_id VARCHAR(100) NOT NULL,
  platform VARCHAR(20) NOT NULL,
  date_played TIMESTAMPTZ NOT NULL,
  duration INTEGER NOT NULL, -- seconds
  result VARCHAR(10) CHECK (result IN ('win', 'loss', 'draw')) NOT NULL,
  score VARCHAR(50),
  kills INTEGER DEFAULT 0,
  deaths INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  damage_dealt INTEGER DEFAULT 0,
  damage_taken INTEGER DEFAULT 0,
  game_mode VARCHAR(50),
  map VARCHAR(100),
  rank_change INTEGER DEFAULT 0,
  match_data JSONB DEFAULT '{}',
  recorded_at TIMESTAMPTZ DEFAULT now()
);

-- ====================================
-- 5. PERFORMANCE INDEXES
-- ====================================

-- Core indexes
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_posts_user_created ON posts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);

-- Gaming indexes
CREATE INDEX IF NOT EXISTS idx_user_game_accounts_user_id ON user_game_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_game_accounts_platform ON user_game_accounts(platform);
CREATE INDEX IF NOT EXISTS idx_user_game_stats_user_id ON user_game_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_games_steam_app_id ON games(steam_app_id);

-- Streaming indexes
CREATE INDEX IF NOT EXISTS idx_streams_status ON streams(status);
CREATE INDEX IF NOT EXISTS idx_streams_streamer_id ON streams(streamer_id);
CREATE INDEX IF NOT EXISTS idx_streams_viewer_count ON streams(viewer_count DESC);

-- ====================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ====================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_game_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_game_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_history ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Posts policies
CREATE POLICY "Posts are viewable by everyone" ON posts FOR SELECT USING (visibility = 'public' OR user_id = auth.uid());
CREATE POLICY "Users can create own posts" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON posts FOR DELETE USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Comments are viewable by everyone" ON comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON comments FOR DELETE USING (auth.uid() = user_id);

-- Likes policies
CREATE POLICY "Likes are viewable by everyone" ON post_likes FOR SELECT USING (true);
CREATE POLICY "Users can like posts" ON post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike posts" ON post_likes FOR DELETE USING (auth.uid() = user_id);

-- Bookmarks policies
CREATE POLICY "Users can view own bookmarks" ON bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create bookmarks" ON bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own bookmarks" ON bookmarks FOR DELETE USING (auth.uid() = user_id);

-- Follows policies
CREATE POLICY "Follows are viewable by everyone" ON follows FOR SELECT USING (true);
CREATE POLICY "Users can follow others" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow others" ON follows FOR DELETE USING (auth.uid() = follower_id);

-- Streams policies
CREATE POLICY "Streams are viewable by everyone" ON streams FOR SELECT USING (true);
CREATE POLICY "Users can create their own streams" ON streams FOR INSERT WITH CHECK (auth.uid() = streamer_id);
CREATE POLICY "Users can update their own streams" ON streams FOR UPDATE USING (auth.uid() = streamer_id);

-- Gaming policies
CREATE POLICY "Users can view their own game accounts" ON user_game_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own game accounts" ON user_game_accounts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Game stats are viewable by everyone" ON user_game_stats FOR SELECT USING (true);
CREATE POLICY "Users can manage their own game stats" ON user_game_stats FOR ALL USING (auth.uid() = user_id);

-- ====================================
-- 7. SEED DATA
-- ====================================

-- Insert popular games
INSERT INTO games (slug, name, platforms, cover_url, steam_app_id) VALUES
  ('valorant', 'Valorant', ARRAY['PC'], 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2mvt.webp', NULL),
  ('fortnite', 'Fortnite', ARRAY['PC', 'PlayStation', 'Xbox', 'Mobile'], 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1nxd.webp', NULL),
  ('minecraft', 'Minecraft', ARRAY['PC', 'PlayStation', 'Xbox', 'Mobile'], 'https://images.igdb.com/igdb/image/upload/t_cover_big/co49x5.webp', 374720),
  ('apex-legends', 'Apex Legends', ARRAY['PC', 'PlayStation', 'Xbox'], 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1x7w.webp', 1172470),
  ('league-of-legends', 'League of Legends', ARRAY['PC'], 'https://images.igdb.com/igdb/image/upload/t_cover_big/co49x6.webp', NULL),
  ('cs2', 'Counter-Strike 2', ARRAY['PC'], 'https://images.igdb.com/igdb/image/upload/t_cover_big/co87wu.webp', 730),
  ('overwatch-2', 'Overwatch 2', ARRAY['PC', 'PlayStation', 'Xbox'], 'https://images.igdb.com/igdb/image/upload/t_cover_big/co4jni.webp', NULL),
  ('rocket-league', 'Rocket League', ARRAY['PC', 'PlayStation', 'Xbox'], 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1igd.webp', 252950)
ON CONFLICT (slug) DO NOTHING;

-- Insert popular tags
INSERT INTO tags (slug, label) VALUES
  ('epic', 'Epic'),
  ('funny', 'Funny'),
  ('clutch', 'Clutch'),
  ('fail', 'Fail'),
  ('glitch', 'Glitch'),
  ('speedrun', 'Speedrun'),
  ('tutorial', 'Tutorial'),
  ('highlight', 'Highlight'),
  ('montage', 'Montage'),
  ('stream-highlight', 'Stream Highlight')
ON CONFLICT (slug) DO NOTHING;

-- ====================================
-- SETUP COMPLETE! ✅
-- ====================================
-- Your IgnisStream database is now ready with ALL ERRORS FIXED!
