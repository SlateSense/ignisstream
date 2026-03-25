-- =====================================================
-- IGNISSTREAM DATABASE PART 2
-- Streaming, Gaming, Indexes & Security Policies
-- =====================================================
-- Run this AFTER COMPLETE_SOCIAL_MEDIA_DATABASE.sql
-- =====================================================

-- =====================================================
-- 10. STREAMING TABLES
-- =====================================================

CREATE TABLE streams (
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE stream_chat (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_id UUID REFERENCES streams(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  username VARCHAR(50) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  message TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  is_moderator BOOLEAN DEFAULT false,
  is_subscriber BOOLEAN DEFAULT false,
  badges TEXT[] DEFAULT '{}'
);

-- =====================================================
-- 11. GAMING INTEGRATION
-- =====================================================

CREATE TABLE user_game_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  platform VARCHAR(20) NOT NULL CHECK (platform IN ('steam', 'epic', 'xbox', 'playstation', 'nintendo', 'gog', 'riot', 'battle_net')),
  platform_user_id VARCHAR(100) NOT NULL,
  platform_username VARCHAR(100) NOT NULL,
  profile_data JSONB DEFAULT '{}',
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  disconnected_at TIMESTAMPTZ,
  last_sync TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, platform)
);

CREATE TABLE user_game_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE NOT NULL,
  platform VARCHAR(20) NOT NULL,
  total_playtime INTEGER DEFAULT 0,
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, game_id, platform)
);

CREATE TABLE match_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE NOT NULL,
  match_id VARCHAR(100) NOT NULL,
  platform VARCHAR(20) NOT NULL,
  date_played TIMESTAMPTZ NOT NULL,
  duration INTEGER NOT NULL,
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
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 12. PERFORMANCE INDEXES
-- =====================================================

-- Profile indexes
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_online ON profiles(is_online);
CREATE INDEX idx_profiles_last_seen ON profiles(last_seen DESC);

-- Post indexes
CREATE INDEX idx_posts_user_created ON posts(user_id, created_at DESC);
CREATE INDEX idx_posts_created ON posts(created_at DESC);
CREATE INDEX idx_posts_visibility ON posts(visibility);
CREATE INDEX idx_posts_game ON posts(game_id);

-- Comment indexes
CREATE INDEX idx_comments_post ON comments(post_id, created_at DESC);
CREATE INDEX idx_comments_user ON comments(user_id);
CREATE INDEX idx_comments_parent ON comments(parent_comment_id);

-- Interaction indexes
CREATE INDEX idx_post_likes_post ON post_likes(post_id);
CREATE INDEX idx_post_likes_user ON post_likes(user_id);
CREATE INDEX idx_comment_likes_comment ON comment_likes(comment_id);
CREATE INDEX idx_bookmarks_user ON bookmarks(user_id, created_at DESC);
CREATE INDEX idx_shares_post ON shares(post_id);

-- Social indexes
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);
CREATE INDEX idx_blocks_blocker ON blocks(blocker_id);

-- Hashtag indexes
CREATE INDEX idx_hashtags_name ON hashtags(name);
CREATE INDEX idx_hashtags_trending ON hashtags(trending_score DESC);
CREATE INDEX idx_post_hashtags_hashtag ON post_hashtags(hashtag_id);
CREATE INDEX idx_post_hashtags_post ON post_hashtags(post_id);

-- Message indexes
CREATE INDEX idx_conversations_updated ON conversations(updated_at DESC);
CREATE INDEX idx_conversation_participants_user ON conversation_participants(user_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);

-- Notification indexes
CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read, created_at DESC);

-- Story indexes
CREATE INDEX idx_stories_user ON stories(user_id, created_at DESC);
CREATE INDEX idx_stories_expires ON stories(expires_at);

-- Gaming indexes
CREATE INDEX idx_user_game_accounts_user_id ON user_game_accounts(user_id);
CREATE INDEX idx_user_game_accounts_platform ON user_game_accounts(platform);
CREATE INDEX idx_user_game_stats_user_id ON user_game_stats(user_id);
CREATE INDEX idx_games_steam_app_id ON games(steam_app_id);

-- Stream indexes
CREATE INDEX idx_streams_status ON streams(status);
CREATE INDEX idx_streams_streamer_id ON streams(streamer_id);
CREATE INDEX idx_streams_viewer_count ON streams(viewer_count DESC);

-- Text search indexes
CREATE INDEX idx_posts_content_search ON posts USING gin(to_tsvector('english', content));
CREATE INDEX idx_hashtags_name_search ON hashtags USING gin(name gin_trgm_ops);
CREATE INDEX idx_profiles_username_search ON profiles USING gin(username gin_trgm_ops);
CREATE INDEX idx_profiles_display_name_search ON profiles USING gin(display_name gin_trgm_ops);

-- =====================================================
-- 13. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_game_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_game_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_views ENABLE ROW LEVEL SECURITY;

-- Profile policies
CREATE POLICY "Profiles viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Post policies
CREATE POLICY "Public posts viewable" ON posts FOR SELECT USING (
  visibility = 'public' OR user_id = auth.uid() OR
  (visibility = 'followers' AND EXISTS (
    SELECT 1 FROM follows WHERE follower_id = auth.uid() AND following_id = user_id
  ))
);
CREATE POLICY "Users create own posts" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own posts" ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own posts" ON posts FOR DELETE USING (auth.uid() = user_id);

-- Comment policies
CREATE POLICY "Comments viewable" ON comments FOR SELECT USING (true);
CREATE POLICY "Users create comments" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own comments" ON comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own comments" ON comments FOR DELETE USING (auth.uid() = user_id);

-- Like policies
CREATE POLICY "Post likes viewable" ON post_likes FOR SELECT USING (true);
CREATE POLICY "Users like posts" ON post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users unlike posts" ON post_likes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Comment likes viewable" ON comment_likes FOR SELECT USING (true);
CREATE POLICY "Users like comments" ON comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users unlike comments" ON comment_likes FOR DELETE USING (auth.uid() = user_id);

-- Bookmark policies
CREATE POLICY "Users view own bookmarks" ON bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create bookmarks" ON bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete bookmarks" ON bookmarks FOR DELETE USING (auth.uid() = user_id);

-- Collection policies
CREATE POLICY "Users view collections" ON saved_collections FOR SELECT USING (
  auth.uid() = user_id OR NOT is_private
);
CREATE POLICY "Users manage collections" ON saved_collections FOR ALL USING (auth.uid() = user_id);

-- Share policies
CREATE POLICY "Shares viewable" ON shares FOR SELECT USING (true);
CREATE POLICY "Users share posts" ON shares FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete shares" ON shares FOR DELETE USING (auth.uid() = user_id);

-- Follow policies
CREATE POLICY "Follows viewable" ON follows FOR SELECT USING (true);
CREATE POLICY "Users follow others" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users unfollow" ON follows FOR DELETE USING (auth.uid() = follower_id);

-- Block policies
CREATE POLICY "Users view own blocks" ON blocks FOR SELECT USING (auth.uid() = blocker_id);
CREATE POLICY "Users block others" ON blocks FOR INSERT WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "Users unblock" ON blocks FOR DELETE USING (auth.uid() = blocker_id);

-- Hashtag policies
CREATE POLICY "Hashtags viewable" ON hashtags FOR SELECT USING (true);
CREATE POLICY "Post hashtags viewable" ON post_hashtags FOR SELECT USING (true);

-- Story policies
CREATE POLICY "Active stories viewable" ON stories FOR SELECT USING (
  expires_at > NOW() AND (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM follows WHERE follower_id = auth.uid() AND following_id = user_id
  ))
);
CREATE POLICY "Users create stories" ON stories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete stories" ON stories FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Story creators view views" ON story_views FOR SELECT USING (
  EXISTS (SELECT 1 FROM stories WHERE stories.id = story_id AND stories.user_id = auth.uid())
);
CREATE POLICY "Users track views" ON story_views FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Poll policies
CREATE POLICY "Polls viewable" ON polls FOR SELECT USING (true);
CREATE POLICY "Poll votes viewable" ON poll_votes FOR SELECT USING (true);
CREATE POLICY "Users vote polls" ON poll_votes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Conversation policies
CREATE POLICY "Users view conversations" ON conversations FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversation_participants 
    WHERE conversation_id = id AND user_id = auth.uid()
  )
);

CREATE POLICY "Participants viewable" ON conversation_participants FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversation_participants cp2
    WHERE cp2.conversation_id = conversation_id AND cp2.user_id = auth.uid()
  )
);

-- Message policies
CREATE POLICY "Users view messages" ON messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversation_participants 
    WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
  )
);
CREATE POLICY "Users send messages" ON messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND EXISTS (
    SELECT 1 FROM conversation_participants 
    WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
  )
);

-- Notification policies
CREATE POLICY "Users view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete notifications" ON notifications FOR DELETE USING (auth.uid() = user_id);

-- Report policies
CREATE POLICY "Users view own reports" ON reports FOR SELECT USING (auth.uid() = reporter_id);
CREATE POLICY "Users create reports" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Stream policies
CREATE POLICY "Streams viewable" ON streams FOR SELECT USING (true);
CREATE POLICY "Users create streams" ON streams FOR INSERT WITH CHECK (auth.uid() = streamer_id);
CREATE POLICY "Users update streams" ON streams FOR UPDATE USING (auth.uid() = streamer_id);

-- Gaming policies
CREATE POLICY "Users view game accounts" ON user_game_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users manage accounts" ON user_game_accounts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Game stats viewable" ON user_game_stats FOR SELECT USING (true);
CREATE POLICY "Users manage stats" ON user_game_stats FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- 14. SEED DATA
-- =====================================================

INSERT INTO games (slug, name, platforms, cover_url, steam_app_id) VALUES
  ('valorant', 'Valorant', ARRAY['PC'], 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2mvt.webp', NULL),
  ('fortnite', 'Fortnite', ARRAY['PC', 'PlayStation', 'Xbox', 'Mobile'], 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1nxd.webp', NULL),
  ('minecraft', 'Minecraft', ARRAY['PC', 'PlayStation', 'Xbox', 'Mobile'], 'https://images.igdb.com/igdb/image/upload/t_cover_big/co49x5.webp', 374720),
  ('apex-legends', 'Apex Legends', ARRAY['PC', 'PlayStation', 'Xbox'], 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1x7w.webp', 1172470),
  ('league-of-legends', 'League of Legends', ARRAY['PC'], 'https://images.igdb.com/igdb/image/upload/t_cover_big/co49x6.webp', NULL),
  ('cs2', 'Counter-Strike 2', ARRAY['PC'], 'https://images.igdb.com/igdb/image/upload/t_cover_big/co87wu.webp', 730),
  ('overwatch-2', 'Overwatch 2', ARRAY['PC', 'PlayStation', 'Xbox'], 'https://images.igdb.com/igdb/image/upload/t_cover_big/co4jni.webp', NULL),
  ('rocket-league', 'Rocket League', ARRAY['PC', 'PlayStation', 'Xbox'], 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1igd.webp', 252950);

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
  ('stream-highlight', 'Stream Highlight');

-- =====================================================
-- ✅ DATABASE SETUP COMPLETE!
-- =====================================================
-- All social media features are now ready to use
-- =====================================================
