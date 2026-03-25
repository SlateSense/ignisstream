-- =====================================================
-- COMPREHENSIVE DATABASE SECURITY CONFIGURATION
-- =====================================================

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_views ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROFILES TABLE SECURITY POLICIES
-- =====================================================

-- Users can view public profiles and their own profile
CREATE POLICY "profiles_select_policy" ON profiles FOR SELECT USING (
  auth.uid() = id OR 
  (privacy_settings->>'profile_visibility')::text = 'public' OR
  (privacy_settings->>'profile_visibility')::text = 'friends' AND 
  EXISTS (
    SELECT 1 FROM follows 
    WHERE follower_id = auth.uid() AND following_id = profiles.id AND status = 'accepted'
  )
);

-- Users can only update their own profile
CREATE POLICY "profiles_update_policy" ON profiles FOR UPDATE USING (
  auth.uid() = id
) WITH CHECK (
  auth.uid() = id AND
  -- Prevent privilege escalation
  (OLD.role = NEW.role OR auth.jwt()->>'role' = 'admin')
);

-- Users can insert their own profile (triggered after auth)
CREATE POLICY "profiles_insert_policy" ON profiles FOR INSERT WITH CHECK (
  auth.uid() = id
);

-- =====================================================
-- POSTS TABLE SECURITY POLICIES
-- =====================================================

-- Users can view public posts and their own posts
CREATE POLICY "posts_select_policy" ON posts FOR SELECT USING (
  is_public = true OR 
  author_id = auth.uid() OR
  -- Friends can see friends-only posts
  (visibility = 'friends' AND EXISTS (
    SELECT 1 FROM follows 
    WHERE follower_id = auth.uid() AND following_id = posts.author_id AND status = 'accepted'
  ))
);

-- Users can insert their own posts
CREATE POLICY "posts_insert_policy" ON posts FOR INSERT WITH CHECK (
  auth.uid() = author_id AND
  -- Content length validation
  LENGTH(content) <= 10000 AND
  LENGTH(title) <= 200
);

-- Users can update their own posts
CREATE POLICY "posts_update_policy" ON posts FOR UPDATE USING (
  auth.uid() = author_id
) WITH CHECK (
  auth.uid() = author_id AND
  -- Prevent changing author
  OLD.author_id = NEW.author_id AND
  -- Content validation
  LENGTH(NEW.content) <= 10000 AND
  LENGTH(NEW.title) <= 200
);

-- Users can delete their own posts, moderators can delete any
CREATE POLICY "posts_delete_policy" ON posts FOR DELETE USING (
  auth.uid() = author_id OR
  auth.jwt()->>'role' IN ('moderator', 'admin', 'super_admin')
);

-- =====================================================
-- INTERACTIONS SECURITY POLICIES (Likes, Bookmarks, Comments)
-- =====================================================

-- Post likes policies
CREATE POLICY "post_likes_select_policy" ON post_likes FOR SELECT USING (
  EXISTS (SELECT 1 FROM posts WHERE id = post_id AND (is_public = true OR author_id = auth.uid()))
);

CREATE POLICY "post_likes_insert_policy" ON post_likes FOR INSERT WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (SELECT 1 FROM posts WHERE id = post_id AND (is_public = true OR author_id = auth.uid()))
);

CREATE POLICY "post_likes_delete_policy" ON post_likes FOR DELETE USING (
  auth.uid() = user_id
);

-- Post bookmarks policies (similar to likes)
CREATE POLICY "post_bookmarks_select_policy" ON post_bookmarks FOR SELECT USING (
  auth.uid() = user_id
);

CREATE POLICY "post_bookmarks_insert_policy" ON post_bookmarks FOR INSERT WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (SELECT 1 FROM posts WHERE id = post_id AND (is_public = true OR author_id = auth.uid()))
);

CREATE POLICY "post_bookmarks_delete_policy" ON post_bookmarks FOR DELETE USING (
  auth.uid() = user_id
);

-- Comments policies
CREATE POLICY "comments_select_policy" ON comments FOR SELECT USING (
  EXISTS (SELECT 1 FROM posts WHERE id = post_id AND (is_public = true OR author_id = auth.uid()))
);

CREATE POLICY "comments_insert_policy" ON comments FOR INSERT WITH CHECK (
  auth.uid() = author_id AND
  LENGTH(content) <= 1000 AND
  EXISTS (SELECT 1 FROM posts WHERE id = post_id AND (is_public = true OR author_id = auth.uid()))
);

CREATE POLICY "comments_update_policy" ON comments FOR UPDATE USING (
  auth.uid() = author_id
) WITH CHECK (
  auth.uid() = author_id AND
  OLD.author_id = NEW.author_id AND
  LENGTH(NEW.content) <= 1000
);

CREATE POLICY "comments_delete_policy" ON comments FOR DELETE USING (
  auth.uid() = author_id OR
  auth.jwt()->>'role' IN ('moderator', 'admin', 'super_admin')
);

-- =====================================================
-- MESSAGES SECURITY POLICIES
-- =====================================================

CREATE POLICY "messages_select_policy" ON messages FOR SELECT USING (
  auth.uid() = sender_id OR 
  auth.uid() = recipient_id
);

CREATE POLICY "messages_insert_policy" ON messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  LENGTH(content) <= 1000 AND
  -- Prevent self-messaging
  sender_id != recipient_id AND
  -- Check if recipient allows messages
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = recipient_id AND 
    (privacy_settings->>'allow_messages')::boolean = true
  )
);

CREATE POLICY "messages_update_policy" ON messages FOR UPDATE USING (
  auth.uid() = sender_id OR auth.uid() = recipient_id
) WITH CHECK (
  -- Only allow marking as read/unread
  OLD.content = NEW.content AND
  OLD.sender_id = NEW.sender_id AND
  OLD.recipient_id = NEW.recipient_id
);

-- =====================================================
-- STREAMING SECURITY POLICIES
-- =====================================================

-- Stream policies
CREATE POLICY "streams_select_policy" ON streams FOR SELECT USING (
  status = 'live' OR 
  streamer_id = auth.uid() OR
  (status = 'ended' AND is_mature = false) OR
  (status = 'ended' AND is_mature = true AND 
   EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND age >= 18))
);

CREATE POLICY "streams_insert_policy" ON streams FOR INSERT WITH CHECK (
  auth.uid() = streamer_id AND
  LENGTH(title) <= 200 AND
  LENGTH(description) <= 1000
);

CREATE POLICY "streams_update_policy" ON streams FOR UPDATE USING (
  auth.uid() = streamer_id
) WITH CHECK (
  auth.uid() = streamer_id AND
  -- Prevent changing streamer
  OLD.streamer_id = NEW.streamer_id
);

CREATE POLICY "streams_delete_policy" ON streams FOR DELETE USING (
  auth.uid() = streamer_id OR
  auth.jwt()->>'role' IN ('moderator', 'admin', 'super_admin')
);

-- Stream chat policies
CREATE POLICY "stream_chat_select_policy" ON stream_chat FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM streams 
    WHERE id = stream_id AND 
    (status = 'live' OR streamer_id = auth.uid())
  )
);

CREATE POLICY "stream_chat_insert_policy" ON stream_chat FOR INSERT WITH CHECK (
  auth.uid() = user_id AND
  LENGTH(message) <= 500 AND
  EXISTS (SELECT 1 FROM streams WHERE id = stream_id AND status = 'live')
);

-- =====================================================
-- GAMING DATA SECURITY POLICIES
-- =====================================================

-- User games (gaming profiles/stats)
CREATE POLICY "user_games_select_policy" ON user_games FOR SELECT USING (
  user_id = auth.uid() OR
  -- Public gaming profiles
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id AND 
    (privacy_settings->>'gaming_profile_visibility')::text = 'public'
  ) OR
  -- Friends can see friends' gaming data
  EXISTS (
    SELECT 1 FROM follows 
    WHERE follower_id = auth.uid() AND following_id = user_id AND status = 'accepted'
  )
);

CREATE POLICY "user_games_insert_policy" ON user_games FOR INSERT WITH CHECK (
  auth.uid() = user_id
);

CREATE POLICY "user_games_update_policy" ON user_games FOR UPDATE USING (
  auth.uid() = user_id
) WITH CHECK (
  auth.uid() = user_id
);

-- =====================================================
-- ADMIN AND MODERATION POLICIES
-- =====================================================

-- Admin users can bypass most restrictions (use carefully)
CREATE POLICY "admin_override_policy" ON profiles FOR ALL TO authenticated USING (
  auth.jwt()->>'role' = 'super_admin'
) WITH CHECK (
  auth.jwt()->>'role' = 'super_admin'
);

-- =====================================================
-- SECURITY FUNCTIONS
-- =====================================================

-- Function to check if user is banned
CREATE OR REPLACE FUNCTION is_user_banned(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id 
    AND (account_status = 'banned' OR account_status = 'suspended')
  );
END;
$$ LANGUAGE plpgsql;

-- Function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
  event_type TEXT,
  user_id UUID,
  details JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO security_logs (event_type, user_id, details, created_at)
  VALUES (event_type, user_id, details, NOW());
EXCEPTION
  WHEN OTHERS THEN
    -- Fail silently to prevent breaking the main operation
    NULL;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SECURITY TRIGGERS
-- =====================================================

-- Trigger to prevent banned users from creating content
CREATE OR REPLACE FUNCTION check_user_not_banned()
RETURNS TRIGGER AS $$
BEGIN
  IF is_user_banned(auth.uid()) THEN
    RAISE EXCEPTION 'Account is banned or suspended';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to content creation tables
CREATE TRIGGER posts_ban_check
  BEFORE INSERT OR UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION check_user_not_banned();

CREATE TRIGGER comments_ban_check
  BEFORE INSERT OR UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION check_user_not_banned();

CREATE TRIGGER messages_ban_check
  BEFORE INSERT OR UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION check_user_not_banned();

-- =====================================================
-- RATE LIMITING TABLE AND FUNCTIONS
-- =====================================================

-- Table to track API usage per user
CREATE TABLE IF NOT EXISTS user_api_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint, window_start)
);

-- Function to check rate limits
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id UUID,
  p_endpoint TEXT,
  p_max_requests INTEGER DEFAULT 60,
  p_window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN AS $$
DECLARE
  current_count INTEGER;
  window_start TIMESTAMPTZ;
BEGIN
  window_start := date_trunc('hour', NOW());
  
  -- Get current usage for this window
  SELECT request_count INTO current_count
  FROM user_api_usage
  WHERE user_id = p_user_id 
    AND endpoint = p_endpoint 
    AND window_start = window_start;
  
  -- If no record exists, create one
  IF current_count IS NULL THEN
    INSERT INTO user_api_usage (user_id, endpoint, window_start, request_count)
    VALUES (p_user_id, p_endpoint, window_start, 1)
    ON CONFLICT (user_id, endpoint, window_start) 
    DO UPDATE SET request_count = user_api_usage.request_count + 1;
    RETURN FALSE; -- Not rate limited
  END IF;
  
  -- Check if over limit
  IF current_count >= p_max_requests THEN
    RETURN TRUE; -- Rate limited
  END IF;
  
  -- Increment counter
  UPDATE user_api_usage 
  SET request_count = request_count + 1
  WHERE user_id = p_user_id 
    AND endpoint = p_endpoint 
    AND window_start = window_start;
  
  RETURN FALSE; -- Not rate limited
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SECURITY MONITORING TABLES
-- =====================================================

-- Table for security event logging
CREATE TABLE IF NOT EXISTS security_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON security_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_user_api_usage_user_endpoint ON user_api_usage(user_id, endpoint);

-- =====================================================
-- CLEANUP FUNCTIONS
-- =====================================================

-- Function to clean old security logs and API usage data
CREATE OR REPLACE FUNCTION cleanup_security_data()
RETURNS VOID AS $$
BEGIN
  -- Remove security logs older than 90 days
  DELETE FROM security_logs 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  -- Remove old API usage data (keep only last 7 days)
  DELETE FROM user_api_usage 
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Schedule the cleanup function to run daily (requires pg_cron extension)
-- SELECT cron.schedule('security-cleanup', '0 2 * * *', 'SELECT cleanup_security_data();');

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Revoke all permissions from public
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;

-- Grant specific permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
