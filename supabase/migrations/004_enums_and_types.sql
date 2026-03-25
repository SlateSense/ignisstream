-- Create custom types and enums for IgnisStream
-- This migration defines all the custom types used throughout the application

-- Team related enums
CREATE TYPE team_type AS ENUM ('casual', 'competitive', 'professional', 'clan');
CREATE TYPE team_member_role AS ENUM ('owner', 'captain', 'member', 'recruit');
CREATE TYPE member_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE application_status AS ENUM ('pending', 'accepted', 'rejected');

-- Event related enums
CREATE TYPE event_type AS ENUM ('practice', 'scrim', 'tournament', 'meeting', 'tryout');
CREATE TYPE event_status AS ENUM ('scheduled', 'ongoing', 'completed', 'cancelled');
CREATE TYPE attendance_response AS ENUM ('pending', 'attending', 'not_attending', 'maybe');

-- Leaderboard related enums
CREATE TYPE leaderboard_type AS ENUM ('global', 'regional', 'friends', 'team', 'tournament');
CREATE TYPE leaderboard_timeframe AS ENUM ('daily', 'weekly', 'monthly', 'season', 'alltime');

-- Tournament related enums
CREATE TYPE tournament_type AS ENUM ('bracket', 'swiss', 'roundrobin', 'battle_royale');
CREATE TYPE tournament_status AS ENUM ('upcoming', 'registration_open', 'registration_closed', 'active', 'completed', 'cancelled');
CREATE TYPE participant_status AS ENUM ('registered', 'checked_in', 'active', 'eliminated', 'withdrawn');

-- Achievement and badge enums
CREATE TYPE achievement_rarity AS ENUM ('common', 'uncommon', 'rare', 'epic', 'legendary');
CREATE TYPE achievement_category AS ENUM ('skill', 'social', 'time', 'special', 'competitive');
CREATE TYPE badge_type AS ENUM ('rank', 'achievement', 'event', 'special');

-- Streak types
CREATE TYPE streak_type AS ENUM ('win', 'kill', 'accuracy', 'consistency', 'improvement');

-- Video and clip related enums
CREATE TYPE clip_status AS ENUM ('uploading', 'processing', 'completed', 'failed');
CREATE TYPE project_status AS ENUM ('draft', 'processing', 'completed', 'archived');

-- Post visibility (already exists but ensuring consistency)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'post_visibility') THEN
        CREATE TYPE post_visibility AS ENUM ('public', 'friends', 'private');
    END IF;
END $$;

-- Create a comprehensive user role enum that extends the existing one
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('user', 'moderator', 'admin', 'verified');
    END IF;
END $$;

-- Create game difficulty/skill levels
CREATE TYPE skill_level AS ENUM ('beginner', 'novice', 'intermediate', 'advanced', 'expert', 'professional');

-- Create notification types
CREATE TYPE notification_type AS ENUM (
    'like', 'comment', 'follow', 'mention', 'team_invite', 'team_application', 
    'tournament_invite', 'achievement', 'system', 'leaderboard_change'
);

-- Create match result types
CREATE TYPE match_result AS ENUM ('win', 'loss', 'draw', 'cancelled');

-- Create content moderation status
CREATE TYPE moderation_status AS ENUM ('pending', 'approved', 'rejected', 'flagged');

-- Create subscription/premium tiers
CREATE TYPE subscription_tier AS ENUM ('free', 'premium', 'pro', 'enterprise');

-- Create report types for content moderation
CREATE TYPE report_type AS ENUM (
    'spam', 'harassment', 'inappropriate_content', 'cheating', 
    'toxicity', 'copyright', 'other'
);

-- Create privacy settings enum
CREATE TYPE privacy_level AS ENUM ('public', 'friends', 'followers', 'private');

-- Create connection status for friends/followers
CREATE TYPE connection_status AS ENUM ('pending', 'accepted', 'blocked');

-- Create game genres
CREATE TYPE game_genre AS ENUM (
    'fps', 'moba', 'battle_royale', 'mmo', 'rts', 'fighting', 
    'racing', 'sports', 'puzzle', 'sandbox', 'survival'
);

-- Create platform types
CREATE TYPE gaming_platform AS ENUM (
    'pc', 'xbox', 'playstation', 'nintendo', 'mobile', 'vr'
);

-- Create communication preferences
CREATE TYPE communication_preference AS ENUM ('voice', 'text', 'both', 'none');

-- Create time zones (commonly used ones)
CREATE TYPE common_timezone AS ENUM (
    'UTC', 'EST', 'CST', 'MST', 'PST', 'GMT', 'CET', 'JST', 'AEST', 'IST'
);

-- Create language preferences
CREATE TYPE supported_language AS ENUM (
    'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar', 'hi'
);

-- Create server regions
CREATE TYPE server_region AS ENUM (
    'na-east', 'na-west', 'eu-west', 'eu-east', 'asia-pacific', 
    'south-america', 'oceania', 'middle-east', 'africa'
);

-- Create activity status
CREATE TYPE activity_status AS ENUM ('online', 'away', 'busy', 'offline', 'invisible');

-- Create match queue types
CREATE TYPE queue_type AS ENUM ('ranked', 'casual', 'competitive', 'custom', 'tournament');

-- Create content rating system
CREATE TYPE content_rating AS ENUM ('everyone', 'teen', 'mature', 'adult');

-- Create verification status
CREATE TYPE verification_status AS ENUM ('unverified', 'pending', 'verified', 'rejected');

-- Create payment status for tournaments/premium features
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded', 'cancelled');

-- Add comments to types for documentation
COMMENT ON TYPE team_type IS 'Types of teams: casual for fun play, competitive for serious play, professional for esports, clan for large communities';
COMMENT ON TYPE tournament_type IS 'Tournament formats: bracket for elimination, swiss for round-robin style, battle_royale for last-player-standing';
COMMENT ON TYPE achievement_rarity IS 'Achievement rarity levels affecting display and rewards';
COMMENT ON TYPE clip_status IS 'Video processing pipeline status';
COMMENT ON TYPE notification_type IS 'All possible notification categories for users';
COMMENT ON TYPE privacy_level IS 'Privacy settings for user content and profile information';
COMMENT ON TYPE game_genre IS 'Gaming genres for categorization and matchmaking';
COMMENT ON TYPE server_region IS 'Geographic server regions for optimal connectivity';
