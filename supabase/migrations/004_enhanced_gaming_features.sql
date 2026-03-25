-- Enhanced Gaming Features Database Schema
-- PlayStation, Nintendo, GOG integrations + Real-time updates + ML Analytics + Social Features

-- Extend games table for new platforms
ALTER TABLE games 
ADD COLUMN IF NOT EXISTS psn_communication_id TEXT,
ADD COLUMN IF NOT EXISTS nintendo_app_id TEXT,
ADD COLUMN IF NOT EXISTS gog_id INTEGER,
ADD COLUMN IF NOT EXISTS genre TEXT,
ADD COLUMN IF NOT EXISTS type TEXT,
ADD COLUMN IF NOT EXISTS difficulty_rating INTEGER DEFAULT 1;

-- Update user_game_accounts to support new platforms
-- No schema change needed as platform field is flexible

-- Extend user_game_stats for enhanced tracking
ALTER TABLE user_game_stats
ADD COLUMN IF NOT EXISTS total_kills INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_deaths INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS headshot_percentage DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS objective_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS survival_time INTEGER DEFAULT 0;

-- Live match updates table
CREATE TABLE IF NOT EXISTS live_match_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id TEXT NOT NULL,
    game_id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('kill', 'death', 'objective', 'round_end', 'match_end')),
    data JSONB NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Game sessions table for play pattern analysis
CREATE TABLE IF NOT EXISTS game_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    game_id TEXT NOT NULL,
    platform TEXT NOT NULL,
    game_mode TEXT,
    game_genre TEXT,
    duration INTEGER NOT NULL DEFAULT 0, -- in seconds
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User game stats history for trend analysis
CREATE TABLE IF NOT EXISTS user_game_stats_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    game_id TEXT NOT NULL,
    win_rate DECIMAL(5,2),
    kd_ratio DECIMAL(5,2),
    matches_played INTEGER,
    skill_rating INTEGER,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Skill predictions table
CREATE TABLE IF NOT EXISTS skill_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    game_id TEXT NOT NULL,
    prediction_data JSONB NOT NULL,
    confidence DECIMAL(3,2) NOT NULL,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    UNIQUE(user_id, game_id)
);

-- Play patterns analysis table
CREATE TABLE IF NOT EXISTS play_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    pattern_data JSONB NOT NULL,
    analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Tournaments table
CREATE TABLE IF NOT EXISTS tournaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    game_id TEXT NOT NULL,
    description TEXT,
    format TEXT NOT NULL CHECK (format IN ('single_elimination', 'double_elimination', 'round_robin', 'swiss')),
    max_participants INTEGER NOT NULL DEFAULT 16,
    entry_fee DECIMAL(10,2),
    prize_pool DECIMAL(10,2),
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')),
    rules TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    moderators UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tournament participants table
CREATE TABLE IF NOT EXISTS tournament_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    skill_rating INTEGER NOT NULL DEFAULT 1000,
    status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'active', 'eliminated', 'winner')),
    registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    eliminated_at TIMESTAMPTZ,
    UNIQUE(tournament_id, user_id)
);

-- Tournament matches table
CREATE TABLE IF NOT EXISTS tournament_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    round INTEGER NOT NULL,
    participant1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    participant2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    winner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    score TEXT,
    scheduled_time TIMESTAMPTZ NOT NULL,
    completed_time TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed', 'forfeit')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Friends system
CREATE TABLE IF NOT EXISTS friends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    UNIQUE(user_id, friend_id),
    CHECK (user_id != friend_id)
);

-- Friend requests notifications
CREATE TABLE IF NOT EXISTS friend_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    requestee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    UNIQUE(requester_id, requestee_id)
);

-- Enhanced achievements system
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon_url TEXT,
    game_id TEXT,
    platform TEXT,
    rarity TEXT NOT NULL DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    points INTEGER NOT NULL DEFAULT 10,
    requirements JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User achievements tracking
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    progress JSONB,
    UNIQUE(user_id, achievement_id)
);

-- Leaderboards table
CREATE TABLE IF NOT EXISTS leaderboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    game_id TEXT NOT NULL,
    stat_type TEXT NOT NULL, -- 'win_rate', 'kd_ratio', 'skill_rating', etc.
    time_period TEXT NOT NULL DEFAULT 'all_time' CHECK (time_period IN ('daily', 'weekly', 'monthly', 'seasonal', 'all_time')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Leaderboard entries
CREATE TABLE IF NOT EXISTS leaderboard_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    leaderboard_id UUID NOT NULL REFERENCES leaderboards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    score DECIMAL(10,2) NOT NULL,
    rank INTEGER NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(leaderboard_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_live_match_updates_user_game ON live_match_updates(user_id, game_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_time ON game_sessions(user_id, start_time);
CREATE INDEX IF NOT EXISTS idx_skill_predictions_user_game ON skill_predictions(user_id, game_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_status_start ON tournaments(status, start_date);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_tournament ON tournament_participants(tournament_id, status);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_tournament ON tournament_matches(tournament_id, round);
CREATE INDEX IF NOT EXISTS idx_friends_user_status ON friends(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_board_rank ON leaderboard_entries(leaderboard_id, rank);

-- Enable Row Level Security
ALTER TABLE live_match_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_game_stats_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE play_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Live match updates: Users can only see their own updates and those of friends
CREATE POLICY "Users can view their own match updates" ON live_match_updates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own match updates" ON live_match_updates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Game sessions: Users can only see and manage their own sessions
CREATE POLICY "Users can manage their own game sessions" ON game_sessions FOR ALL
  USING (auth.uid() = user_id);

-- Skill predictions: Users can only see their own predictions
CREATE POLICY "Users can view their own skill predictions" ON skill_predictions FOR ALL
  USING (auth.uid() = user_id);

-- Play patterns: Users can only see their own patterns
CREATE POLICY "Users can view their own play patterns" ON play_patterns FOR ALL
  USING (auth.uid() = user_id);

-- Tournaments: Public read, creator/moderator write
CREATE POLICY "Anyone can view tournaments" ON tournaments FOR SELECT
  USING (true);

CREATE POLICY "Tournament creators can manage tournaments" ON tournaments FOR ALL
  USING (auth.uid() = created_by OR auth.uid() = ANY(moderators));

-- Tournament participants: Public read, user can manage own participation
CREATE POLICY "Anyone can view tournament participants" ON tournament_participants FOR SELECT
  USING (true);

CREATE POLICY "Users can manage own tournament participation" ON tournament_participants FOR ALL
  USING (auth.uid() = user_id);

-- Tournament matches: Public read, participants can update results
CREATE POLICY "Anyone can view tournament matches" ON tournament_matches FOR SELECT
  USING (true);

CREATE POLICY "Participants can update match results" ON tournament_matches FOR UPDATE
  USING (auth.uid() = participant1_id OR auth.uid() = participant2_id);

-- Friends: Users can see their own friends and friend requests
CREATE POLICY "Users can manage their own friendships" ON friends FOR ALL
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can manage their own friend requests" ON friend_requests FOR ALL
  USING (auth.uid() = requester_id OR auth.uid() = requestee_id);

-- Achievements: Public read, system write
CREATE POLICY "Anyone can view achievements" ON achievements FOR SELECT
  USING (true);

-- User achievements: Users can see their own achievements
CREATE POLICY "Users can view their own achievements" ON user_achievements FOR SELECT
  USING (auth.uid() = user_id);

-- Leaderboards: Public read
CREATE POLICY "Anyone can view leaderboards" ON leaderboards FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view leaderboard entries" ON leaderboard_entries FOR SELECT
  USING (true);

-- Functions for automatic updates

-- Update user_game_stats_history when user_game_stats changes
CREATE OR REPLACE FUNCTION update_user_game_stats_history()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_game_stats_history (
    user_id, 
    game_id, 
    win_rate, 
    kd_ratio, 
    matches_played, 
    skill_rating
  ) VALUES (
    NEW.user_id,
    NEW.game_id,
    NEW.win_rate,
    NEW.kd_ratio,
    NEW.matches_played,
    COALESCE(NEW.skill_rating, 1000)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for stats history
DROP TRIGGER IF EXISTS trigger_user_game_stats_history ON user_game_stats;
CREATE TRIGGER trigger_user_game_stats_history
  AFTER UPDATE ON user_game_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_user_game_stats_history();

-- Function to calculate tournament rankings
CREATE OR REPLACE FUNCTION calculate_tournament_rankings(tournament_uuid UUID)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  wins INTEGER,
  losses INTEGER,
  points INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tp.user_id,
    p.username,
    COUNT(CASE WHEN tm.winner_id = tp.user_id THEN 1 END)::INTEGER AS wins,
    COUNT(CASE WHEN tm.winner_id IS NOT NULL AND tm.winner_id != tp.user_id THEN 1 END)::INTEGER AS losses,
    (COUNT(CASE WHEN tm.winner_id = tp.user_id THEN 1 END) * 3)::INTEGER AS points
  FROM tournament_participants tp
  LEFT JOIN tournament_matches tm ON (tm.participant1_id = tp.user_id OR tm.participant2_id = tp.user_id)
    AND tm.tournament_id = tournament_uuid
  LEFT JOIN profiles p ON p.id = tp.user_id
  WHERE tp.tournament_id = tournament_uuid
  GROUP BY tp.user_id, p.username
  ORDER BY points DESC, wins DESC;
END;
$$ LANGUAGE plpgsql;
