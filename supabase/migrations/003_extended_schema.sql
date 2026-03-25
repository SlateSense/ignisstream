-- Extended schema for IgnisStream features
-- This migration adds tables for teams, leaderboards, tournaments, and advanced features

-- Create teams table
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  tag VARCHAR(10) NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  banner_url TEXT,
  type team_type NOT NULL DEFAULT 'casual',
  game VARCHAR(50) NOT NULL,
  region VARCHAR(10) NOT NULL,
  language TEXT[] DEFAULT ARRAY['en'],
  max_members INTEGER NOT NULL DEFAULT 5,
  current_members INTEGER NOT NULL DEFAULT 1,
  is_public BOOLEAN NOT NULL DEFAULT true,
  requires_application BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Team stats
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  win_rate DECIMAL(5,2) DEFAULT 0.00,
  average_rating INTEGER DEFAULT 0,
  tournament_wins INTEGER DEFAULT 0,
  total_matches INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  streak_type VARCHAR(10) DEFAULT 'none',
  ranking INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  
  -- Team settings
  auto_accept_applications BOOLEAN DEFAULT false,
  minimum_skill_rating INTEGER DEFAULT 0,
  maximum_skill_rating INTEGER DEFAULT 5000,
  preferred_roles TEXT[] DEFAULT ARRAY[]::TEXT[],
  voice_required BOOLEAN DEFAULT false,
  age_restriction INTEGER,
  region_locked BOOLEAN DEFAULT false,
  custom_requirements TEXT[] DEFAULT ARRAY[]::TEXT[]
);

-- Create team_members table
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  role team_member_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status member_status NOT NULL DEFAULT 'active',
  
  -- Member stats
  games_played INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  avg_performance DECIMAL(5,2) DEFAULT 0.00,
  contribution DECIMAL(5,2) DEFAULT 0.00,
  leadership DECIMAL(5,2) DEFAULT 50.00,
  teamwork DECIMAL(5,2) DEFAULT 50.00,
  reliability DECIMAL(5,2) DEFAULT 50.00,
  
  UNIQUE(user_id, team_id)
);

-- Create team_applications table
CREATE TABLE team_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  message TEXT,
  preferred_role VARCHAR(50),
  availability JSONB,
  experience TEXT,
  status application_status NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES profiles(id),
  review_notes TEXT,
  
  UNIQUE(user_id, team_id)
);

-- Create team_events table
CREATE TABLE team_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  organizer_id UUID NOT NULL REFERENCES profiles(id),
  type event_type NOT NULL DEFAULT 'practice',
  title VARCHAR(200) NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration INTEGER NOT NULL DEFAULT 60, -- minutes
  location VARCHAR(200),
  status event_status NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Event results
  outcome VARCHAR(20),
  score VARCHAR(50),
  mvp UUID REFERENCES profiles(id),
  performance JSONB,
  notes TEXT
);

-- Create team_event_attendees table
CREATE TABLE team_event_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES team_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  required BOOLEAN NOT NULL DEFAULT false,
  response attendance_response DEFAULT 'pending',
  responded_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(event_id, user_id)
);

-- Create leaderboards table
CREATE TABLE leaderboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  game VARCHAR(50) NOT NULL,
  type leaderboard_type NOT NULL DEFAULT 'global',
  timeframe leaderboard_timeframe NOT NULL DEFAULT 'weekly',
  metric VARCHAR(50) NOT NULL DEFAULT 'skill_rating',
  max_entries INTEGER NOT NULL DEFAULT 1000,
  config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create leaderboard_entries table
CREATE TABLE leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leaderboard_id UUID NOT NULL REFERENCES leaderboards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL,
  previous_rank INTEGER DEFAULT 0,
  score INTEGER NOT NULL,
  metrics JSONB NOT NULL DEFAULT '{}',
  achievements TEXT[] DEFAULT ARRAY[]::TEXT[],
  badges TEXT[] DEFAULT ARRAY[]::TEXT[],
  streaks JSONB DEFAULT '[]',
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(leaderboard_id, user_id)
);

-- Create tournaments table
CREATE TABLE tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  game VARCHAR(50) NOT NULL,
  type tournament_type NOT NULL DEFAULT 'bracket',
  status tournament_status NOT NULL DEFAULT 'upcoming',
  entry_fee INTEGER DEFAULT 0,
  prize_pool INTEGER NOT NULL DEFAULT 0,
  max_participants INTEGER NOT NULL DEFAULT 64,
  current_participants INTEGER NOT NULL DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  registration_deadline TIMESTAMP WITH TIME ZONE,
  rules JSONB DEFAULT '[]',
  bracket JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES profiles(id)
);

-- Create tournament_participants table
CREATE TABLE tournament_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  seed_number INTEGER,
  status participant_status NOT NULL DEFAULT 'registered',
  
  CONSTRAINT participant_type_check CHECK (
    (user_id IS NOT NULL AND team_id IS NULL) OR 
    (user_id IS NULL AND team_id IS NOT NULL)
  ),
  UNIQUE(tournament_id, user_id),
  UNIQUE(tournament_id, team_id)
);

-- Create user_achievements table
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id VARCHAR(100) NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  icon VARCHAR(200),
  rarity achievement_rarity NOT NULL DEFAULT 'common',
  category achievement_category NOT NULL DEFAULT 'skill',
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  progress INTEGER DEFAULT 100,
  max_progress INTEGER DEFAULT 100,
  
  UNIQUE(user_id, achievement_id)
);

-- Create user_badges table
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id VARCHAR(100) NOT NULL,
  name VARCHAR(200) NOT NULL,
  type badge_type NOT NULL DEFAULT 'achievement',
  icon VARCHAR(200),
  color VARCHAR(50),
  description TEXT,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(user_id, badge_id)
);

-- Create user_streaks table
CREATE TABLE user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type streak_type NOT NULL,
  current_count INTEGER NOT NULL DEFAULT 0,
  best_count INTEGER NOT NULL DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  UNIQUE(user_id, type)
);

-- Create game_sessions table for tracking user gaming sessions
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  game VARCHAR(50) NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  duration INTEGER, -- seconds
  performance_metrics JSONB DEFAULT '{}',
  match_id VARCHAR(200),
  game_mode VARCHAR(100),
  map_name VARCHAR(100),
  
  -- Performance data
  kills INTEGER DEFAULT 0,
  deaths INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  score INTEGER DEFAULT 0,
  accuracy DECIMAL(5,2) DEFAULT 0.00,
  headshot_percentage DECIMAL(5,2) DEFAULT 0.00,
  
  -- Calculated fields
  kdr DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE 
      WHEN deaths = 0 THEN kills::DECIMAL
      ELSE ROUND((kills::DECIMAL / deaths::DECIMAL), 2)
    END
  ) STORED
);

-- Create video_clips table for clip editor feature
CREATE TABLE video_clips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  game VARCHAR(50),
  
  -- File information
  original_url TEXT NOT NULL,
  thumbnail_url TEXT,
  processed_url TEXT,
  duration INTEGER, -- seconds
  file_size BIGINT,
  resolution VARCHAR(20),
  fps INTEGER,
  
  -- AI Analysis
  ai_tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  ai_highlights JSONB DEFAULT '[]',
  ai_confidence DECIMAL(3,2) DEFAULT 0.00,
  processing_status clip_status NOT NULL DEFAULT 'uploading',
  
  -- Engagement
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  
  -- Privacy
  visibility post_visibility NOT NULL DEFAULT 'public',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create clip_editing_projects table
CREATE TABLE clip_editing_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  
  -- Project data
  timeline_data JSONB NOT NULL DEFAULT '{}',
  assets JSONB DEFAULT '[]',
  export_settings JSONB DEFAULT '{}',
  
  -- Status
  status project_status NOT NULL DEFAULT 'draft',
  last_saved TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_game ON posts(game);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_visibility ON posts(visibility);

CREATE INDEX idx_teams_game ON teams(game);
CREATE INDEX idx_teams_region ON teams(region);
CREATE INDEX idx_teams_type ON teams(type);
CREATE INDEX idx_teams_is_public ON teams(is_public);

CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_role ON team_members(role);

CREATE INDEX idx_leaderboard_entries_leaderboard_id ON leaderboard_entries(leaderboard_id);
CREATE INDEX idx_leaderboard_entries_rank ON leaderboard_entries(rank);
CREATE INDEX idx_leaderboard_entries_score ON leaderboard_entries(score DESC);

CREATE INDEX idx_game_sessions_user_id ON game_sessions(user_id);
CREATE INDEX idx_game_sessions_game ON game_sessions(game);
CREATE INDEX idx_game_sessions_start_time ON game_sessions(start_time DESC);

CREATE INDEX idx_video_clips_user_id ON video_clips(user_id);
CREATE INDEX idx_video_clips_game ON video_clips(game);
CREATE INDEX idx_video_clips_processing_status ON video_clips(processing_status);
CREATE INDEX idx_video_clips_created_at ON video_clips(created_at DESC);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leaderboards_updated_at BEFORE UPDATE ON leaderboards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_video_clips_updated_at BEFORE UPDATE ON video_clips FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clip_editing_projects_updated_at BEFORE UPDATE ON clip_editing_projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
