-- Live Streaming Tables

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

-- Stream views tracking
CREATE TABLE IF NOT EXISTS stream_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_id UUID REFERENCES streams(id) ON DELETE CASCADE NOT NULL,
  viewer_id UUID REFERENCES profiles(id),
  duration INTEGER NOT NULL, -- seconds watched
  viewed_at TIMESTAMPTZ DEFAULT now(),
  ip_address INET,
  user_agent TEXT
);

-- VODs (Video on Demand) table
CREATE TABLE IF NOT EXISTS vods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_id UUID REFERENCES streams(id) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  streamer_id UUID REFERENCES profiles(id) NOT NULL,
  game_id UUID REFERENCES games(id),
  duration INTEGER NOT NULL, -- seconds
  view_count INTEGER DEFAULT 0,
  thumbnail_url TEXT,
  video_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  category VARCHAR(50) NOT NULL,
  tags TEXT[] DEFAULT '{}',
  is_mature BOOLEAN DEFAULT false,
  max_viewers INTEGER DEFAULT 0
);

-- Streamer follows
CREATE TABLE IF NOT EXISTS streamer_follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  streamer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  followed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(follower_id, streamer_id)
);

-- Game API Integration Tables

-- User connected gaming accounts
CREATE TABLE IF NOT EXISTS user_game_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  platform VARCHAR(20) NOT NULL CHECK (platform IN ('steam', 'epic', 'xbox', 'playstation')),
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

-- Game achievements
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE NOT NULL,
  platform VARCHAR(20) NOT NULL,
  achievement_id VARCHAR(100) NOT NULL,
  achievement_name VARCHAR(200) NOT NULL,
  achievement_description TEXT,
  unlocked_at TIMESTAMPTZ NOT NULL,
  is_rare BOOLEAN DEFAULT false,
  completion_percentage DECIMAL(5,2),
  UNIQUE(user_id, game_id, platform, achievement_id)
);

-- Enhanced games table (add new columns if they don't exist)
ALTER TABLE games ADD COLUMN IF NOT EXISTS steam_app_id INTEGER;
ALTER TABLE games ADD COLUMN IF NOT EXISTS epic_app_id VARCHAR(50);
ALTER TABLE games ADD COLUMN IF NOT EXISTS xbox_product_id VARCHAR(50);
ALTER TABLE games ADD COLUMN IF NOT EXISTS playstation_product_id VARCHAR(50);
ALTER TABLE games ADD COLUMN IF NOT EXISTS platform VARCHAR(20) DEFAULT 'multi';
ALTER TABLE games ADD COLUMN IF NOT EXISTS developer VARCHAR(200);
ALTER TABLE games ADD COLUMN IF NOT EXISTS publisher VARCHAR(200);
ALTER TABLE games ADD COLUMN IF NOT EXISTS release_date DATE;
ALTER TABLE games ADD COLUMN IF NOT EXISTS metacritic_score INTEGER;
ALTER TABLE games ADD COLUMN IF NOT EXISTS esrb_rating VARCHAR(20);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_streams_status ON streams(status);
CREATE INDEX IF NOT EXISTS idx_streams_streamer_id ON streams(streamer_id);
CREATE INDEX IF NOT EXISTS idx_streams_category ON streams(category);
CREATE INDEX IF NOT EXISTS idx_streams_viewer_count ON streams(viewer_count DESC);
CREATE INDEX IF NOT EXISTS idx_stream_chat_stream_id ON stream_chat(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_chat_timestamp ON stream_chat(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_stream_views_stream_id ON stream_views(stream_id);
CREATE INDEX IF NOT EXISTS idx_vods_streamer_id ON vods(streamer_id);
CREATE INDEX IF NOT EXISTS idx_vods_created_at ON vods(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_streamer_follows_follower ON streamer_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_streamer_follows_streamer ON streamer_follows(streamer_id);
CREATE INDEX IF NOT EXISTS idx_user_game_accounts_user_id ON user_game_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_game_accounts_platform ON user_game_accounts(platform);
CREATE INDEX IF NOT EXISTS idx_user_game_stats_user_id ON user_game_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_game_stats_game_id ON user_game_stats(game_id);
CREATE INDEX IF NOT EXISTS idx_match_history_user_id ON match_history(user_id);
CREATE INDEX IF NOT EXISTS idx_match_history_game_id ON match_history(game_id);
CREATE INDEX IF NOT EXISTS idx_match_history_date_played ON match_history(date_played DESC);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_games_steam_app_id ON games(steam_app_id);

-- Functions for updating watch time
CREATE OR REPLACE FUNCTION increment_watch_time(stream_id UUID, duration INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE streams 
  SET total_watch_time = total_watch_time + duration
  WHERE id = stream_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_streams_updated_at 
  BEFORE UPDATE ON streams 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_game_stats_updated_at 
  BEFORE UPDATE ON user_game_stats 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) policies
ALTER TABLE streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE vods ENABLE ROW LEVEL SECURITY;
ALTER TABLE streamer_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_game_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_game_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Streams policies
CREATE POLICY "Streams are viewable by everyone" ON streams FOR SELECT USING (true);
CREATE POLICY "Users can create their own streams" ON streams FOR INSERT WITH CHECK (auth.uid() = streamer_id);
CREATE POLICY "Users can update their own streams" ON streams FOR UPDATE USING (auth.uid() = streamer_id);
CREATE POLICY "Users can delete their own streams" ON streams FOR DELETE USING (auth.uid() = streamer_id);

-- Stream chat policies  
CREATE POLICY "Stream chat is viewable by everyone" ON stream_chat FOR SELECT USING (true);
CREATE POLICY "Authenticated users can send chat messages" ON stream_chat FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own messages" ON stream_chat FOR DELETE USING (auth.uid() = user_id);

-- Stream views policies
CREATE POLICY "Stream views are viewable by streamers and admins" ON stream_views FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM streams WHERE streams.id = stream_views.stream_id AND streams.streamer_id = auth.uid()
  )
);
CREATE POLICY "Anyone can record stream views" ON stream_views FOR INSERT USING (true);

-- VODs policies
CREATE POLICY "VODs are viewable by everyone" ON vods FOR SELECT USING (true);
CREATE POLICY "Users can create VODs for their streams" ON vods FOR INSERT WITH CHECK (auth.uid() = streamer_id);
CREATE POLICY "Users can update their own VODs" ON vods FOR UPDATE USING (auth.uid() = streamer_id);
CREATE POLICY "Users can delete their own VODs" ON vods FOR DELETE USING (auth.uid() = streamer_id);

-- Streamer follows policies
CREATE POLICY "Users can view follows" ON streamer_follows FOR SELECT USING (true);
CREATE POLICY "Users can follow/unfollow streamers" ON streamer_follows FOR ALL USING (auth.uid() = follower_id);

-- User game accounts policies
CREATE POLICY "Users can view their own game accounts" ON user_game_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own game accounts" ON user_game_accounts FOR ALL USING (auth.uid() = user_id);

-- User game stats policies
CREATE POLICY "Game stats are viewable by everyone" ON user_game_stats FOR SELECT USING (true);
CREATE POLICY "Users can manage their own game stats" ON user_game_stats FOR ALL USING (auth.uid() = user_id);

-- Match history policies
CREATE POLICY "Match history is viewable by everyone" ON match_history FOR SELECT USING (true);
CREATE POLICY "Users can manage their own match history" ON match_history FOR ALL USING (auth.uid() = user_id);

-- User achievements policies
CREATE POLICY "Achievements are viewable by everyone" ON user_achievements FOR SELECT USING (true);
CREATE POLICY "Users can manage their own achievements" ON user_achievements FOR ALL USING (auth.uid() = user_id);
