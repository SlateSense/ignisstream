-- Seed data for IgnisStream platform
-- This migration populates the database with initial data for development and testing

-- Insert sample games data
INSERT INTO games (id, name, genre, developer, release_date, description, image_url) VALUES
('valorant', 'Valorant', 'fps', 'Riot Games', '2020-06-02', 'A 5v5 character-based tactical FPS', 'https://example.com/valorant.jpg'),
('lol', 'League of Legends', 'moba', 'Riot Games', '2009-10-27', 'A multiplayer online battle arena game', 'https://example.com/lol.jpg'),
('csgo', 'Counter-Strike: Global Offensive', 'fps', 'Valve Corporation', '2012-08-21', 'The classic tactical FPS', 'https://example.com/csgo.jpg'),
('fortnite', 'Fortnite', 'battle_royale', 'Epic Games', '2017-07-25', 'Battle royale with building mechanics', 'https://example.com/fortnite.jpg'),
('apex', 'Apex Legends', 'battle_royale', 'Respawn Entertainment', '2019-02-04', 'Fast-paced battle royale with legends', 'https://example.com/apex.jpg'),
('overwatch2', 'Overwatch 2', 'fps', 'Blizzard Entertainment', '2022-10-04', 'Team-based multiplayer FPS', 'https://example.com/ow2.jpg'),
('rocket-league', 'Rocket League', 'sports', 'Psyonix', '2015-07-07', 'Soccer with rocket-powered cars', 'https://example.com/rl.jpg'),
('minecraft', 'Minecraft', 'sandbox', 'Mojang Studios', '2011-11-18', 'Open-world sandbox building game', 'https://example.com/minecraft.jpg')
ON CONFLICT (id) DO NOTHING;

-- Create default leaderboards for each game
INSERT INTO leaderboards (id, name, game, type, timeframe, metric, max_entries, config, is_active) VALUES
(gen_random_uuid(), 'Valorant Global Weekly', 'valorant', 'global', 'weekly', 'skill_rating', 1000, '{"region": "global", "min_games": 10}', true),
(gen_random_uuid(), 'Valorant Monthly Champions', 'valorant', 'global', 'monthly', 'skill_rating', 500, '{"region": "global", "min_games": 25}', true),
(gen_random_uuid(), 'League of Legends Ranked', 'lol', 'global', 'season', 'skill_rating', 1000, '{"queue": "ranked_solo", "min_games": 20}', true),
(gen_random_uuid(), 'CS:GO Competitive', 'csgo', 'global', 'monthly', 'skill_rating', 1000, '{"mode": "competitive", "min_games": 15}', true),
(gen_random_uuid(), 'Fortnite Arena Weekly', 'fortnite', 'global', 'weekly', 'arena_points', 1000, '{"mode": "arena", "min_games": 10}', true),
(gen_random_uuid(), 'Apex Legends Ranked', 'apex', 'global', 'season', 'ranked_points', 1000, '{"mode": "ranked", "min_games": 20}', true)
ON CONFLICT DO NOTHING;

-- Insert achievement templates
INSERT INTO user_achievements (id, user_id, achievement_id, name, description, icon, rarity, category, unlocked_at, progress, max_progress) 
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000'::uuid, -- placeholder user
  achievement_data.id,
  achievement_data.name,
  achievement_data.description,
  achievement_data.icon,
  achievement_data.rarity::achievement_rarity,
  achievement_data.category::achievement_category,
  NOW(),
  100,
  100
FROM (VALUES
  ('first_kill', 'First Blood', 'Get your first kill in any game', 'trophy', 'common', 'skill'),
  ('ace_master', 'Ace Master', 'Get an ace (5 kills in one round)', 'crown', 'epic', 'skill'),
  ('clutch_king', 'Clutch King', 'Win 10 clutch rounds (1v2 or better)', 'shield', 'rare', 'skill'),
  ('headshot_hero', 'Headshot Hero', 'Achieve 75% headshot accuracy in a match', 'target', 'rare', 'skill'),
  ('team_player', 'Team Player', 'Join your first team', 'users', 'common', 'social'),
  ('tournament_champion', 'Tournament Champion', 'Win your first tournament', 'trophy', 'legendary', 'competitive'),
  ('content_creator', 'Content Creator', 'Upload your first clip', 'video', 'common', 'social'),
  ('viral_moment', 'Viral Moment', 'Get 1000 views on a clip', 'trending-up', 'rare', 'social'),
  ('early_bird', 'Early Bird', 'Play during early morning hours (5-8 AM)', 'sunrise', 'uncommon', 'time'),
  ('night_owl', 'Night Owl', 'Play during late night hours (11 PM - 3 AM)', 'moon', 'uncommon', 'time'),
  ('perfectionist', 'Perfectionist', 'Achieve 100% accuracy in a match', 'check-circle', 'epic', 'skill'),
  ('comeback_king', 'Comeback King', 'Win a match after being down 0-8', 'arrow-up', 'rare', 'skill'),
  ('social_butterfly', 'Social Butterfly', 'Have 100 followers', 'heart', 'uncommon', 'social'),
  ('mentor', 'Mentor', 'Help 10 new players improve their rank', 'graduation-cap', 'rare', 'social'),
  ('grinder', 'The Grinder', 'Play 500 matches', 'clock', 'rare', 'time')
) AS achievement_data(id, name, description, icon, rarity, category)
WHERE NOT EXISTS (
  SELECT 1 FROM user_achievements ua 
  WHERE ua.achievement_id = achievement_data.id 
  AND ua.user_id = '00000000-0000-0000-0000-000000000000'::uuid
);

-- Insert sample tournament templates
INSERT INTO tournaments (id, name, description, game, type, status, prize_pool, max_participants, start_date, end_date, created_by) VALUES
(gen_random_uuid(), 'IgnisStream Weekly Cup', 'Weekly tournament for all skill levels', 'valorant', 'bracket', 'upcoming', 500, 64, NOW() + INTERVAL '7 days', NOW() + INTERVAL '8 days', '00000000-0000-0000-0000-000000000000'::uuid),
(gen_random_uuid(), 'Beginner Friendly Tournament', 'Tournament for players new to competitive play', 'lol', 'swiss', 'upcoming', 200, 32, NOW() + INTERVAL '14 days', NOW() + INTERVAL '15 days', '00000000-0000-0000-0000-000000000000'::uuid),
(gen_random_uuid(), 'Pro Circuit Qualifier', 'Qualify for the professional circuit', 'csgo', 'bracket', 'registration_open', 2000, 16, NOW() + INTERVAL '21 days', NOW() + INTERVAL '23 days', '00000000-0000-0000-0000-000000000000'::uuid)
ON CONFLICT DO NOTHING;

-- Insert sample hashtags for content discovery
INSERT INTO hashtags (name, usage_count, trending_score, created_at) VALUES
('#clutch', 12500, 95.5, NOW() - INTERVAL '30 days'),
('#ace', 8900, 88.2, NOW() - INTERVAL '25 days'),
('#funny', 15600, 92.1, NOW() - INTERVAL '20 days'),
('#epic', 11200, 87.3, NOW() - INTERVAL '15 days'),
('#fail', 9800, 75.4, NOW() - INTERVAL '10 days'),
('#valorant', 45000, 98.7, NOW() - INTERVAL '90 days'),
('#lol', 38000, 96.2, NOW() - INTERVAL '85 days'),
('#csgo', 32000, 94.1, NOW() - INTERVAL '80 days'),
('#fortnite', 28000, 91.8, NOW() - INTERVAL '75 days'),
('#esports', 22000, 89.5, NOW() - INTERVAL '70 days'),
('#gaming', 55000, 99.2, NOW() - INTERVAL '100 days'),
('#highlights', 18000, 85.6, NOW() - INTERVAL '60 days'),
('#montage', 7500, 78.9, NOW() - INTERVAL '45 days'),
('#tutorial', 6800, 72.3, NOW() - INTERVAL '40 days'),
('#tips', 9200, 80.1, NOW() - INTERVAL '35 days')
ON CONFLICT (name) DO UPDATE SET 
  usage_count = EXCLUDED.usage_count,
  trending_score = EXCLUDED.trending_score;

-- Create sample roles and permissions for teams
CREATE OR REPLACE FUNCTION create_sample_team_with_members()
RETURNS void AS $$
DECLARE
  sample_team_id UUID;
  sample_user_id UUID;
BEGIN
  -- Create a sample public team for demonstration
  INSERT INTO teams (
    id, name, tag, description, type, game, region, language, 
    max_members, current_members, is_public, requires_application,
    wins, losses, win_rate, average_rating
  ) VALUES (
    gen_random_uuid(), 'IgnisStream Legends', 'ISL', 
    'Official demo team showcasing platform features', 
    'competitive', 'valorant', 'na-east', ARRAY['en'], 
    5, 2, true, false,
    15, 3, 83.33, 2250
  ) RETURNING id INTO sample_team_id;
  
  -- Note: In a real scenario, these would be actual user IDs
  -- For demo purposes, we're using placeholder UUIDs
END;
$$ LANGUAGE plpgsql;

-- Execute the sample team creation
SELECT create_sample_team_with_members();

-- Drop the temporary function
DROP FUNCTION create_sample_team_with_members();

-- Insert sample game modes and maps for popular games
INSERT INTO game_modes (game_id, name, description, max_players, duration_minutes) VALUES
('valorant', 'Unrated', 'Casual 5v5 matches', 10, 45),
('valorant', 'Competitive', 'Ranked 5v5 matches', 10, 60),
('valorant', 'Spike Rush', 'Quick 4v4 matches', 8, 12),
('valorant', 'Deathmatch', 'Free-for-all combat', 14, 9),
('lol', 'Ranked Solo/Duo', 'Competitive 5v5 on Summoners Rift', 10, 35),
('lol', 'Normal Draft', 'Casual 5v5 with pick/ban phase', 10, 35),
('lol', 'ARAM', 'All random all mid on Howling Abyss', 10, 20),
('csgo', 'Competitive', 'First to 16 rounds wins', 10, 45),
('csgo', 'Casual', 'Relaxed 10v10 matches', 20, 15),
('csgo', 'Wingman', '2v2 competitive matches', 4, 20)
ON CONFLICT DO NOTHING;

-- Insert popular maps for games
INSERT INTO game_maps (game_id, name, mode, description, image_url) VALUES
('valorant', 'Bind', 'standard', 'Two-site map with teleporters', 'https://playvalorant.com/assets/maps/bind.jpg'),
('valorant', 'Haven', 'standard', 'Three-site map with multiple routes', 'https://playvalorant.com/assets/maps/haven.jpg'),
('valorant', 'Split', 'standard', 'Vertical map with elevated positions', 'https://playvalorant.com/assets/maps/split.jpg'),
('valorant', 'Ascent', 'standard', 'Open map with long sightlines', 'https://playvalorant.com/assets/maps/ascent.jpg'),
('lol', 'Summoners Rift', 'standard', 'The classic 5v5 map', 'https://riot.com/assets/maps/sr.jpg'),
('lol', 'Howling Abyss', 'aram', 'Single lane ARAM map', 'https://riot.com/assets/maps/ha.jpg'),
('csgo', 'Dust2', 'defusal', 'Iconic desert map', 'https://steamcdn-a.akamaihd.net/apps/csgo/images/maps/dust2.jpg'),
('csgo', 'Mirage', 'defusal', 'Middle-eastern themed map', 'https://steamcdn-a.akamaihd.net/apps/csgo/images/maps/mirage.jpg'),
('csgo', 'Inferno', 'defusal', 'Italian-inspired tight corridors', 'https://steamcdn-a.akamaihd.net/apps/csgo/images/maps/inferno.jpg')
ON CONFLICT DO NOTHING;

-- Insert notification templates for system messages
INSERT INTO notification_templates (type, title_template, body_template, action_url_template) VALUES
('achievement', 'Achievement Unlocked!', 'You earned the "{{achievement_name}}" achievement!', '/profile/achievements'),
('team_invite', 'Team Invitation', '{{team_name}} has invited you to join their team', '/teams/{{team_id}}'),
('tournament_reminder', 'Tournament Starting Soon', 'Your tournament "{{tournament_name}}" starts in {{time_remaining}}', '/tournaments/{{tournament_id}}'),
('leaderboard_change', 'Rank Update', 'You moved from #{{old_rank}} to #{{new_rank}} on the {{leaderboard_name}} leaderboard!', '/leaderboards'),
('clip_processed', 'Clip Ready', 'Your clip "{{clip_title}}" has finished processing', '/clips/{{clip_id}}'),
('team_application', 'New Team Application', '{{user_name}} has applied to join {{team_name}}', '/teams/{{team_id}}/applications'),
('follow_request', 'New Follower', '{{user_name}} started following you', '/profile/{{user_id}}'),
('post_like', 'New Like', '{{user_name}} liked your post', '/post/{{post_id}}'),
('comment_mention', 'Mentioned in Comment', '{{user_name}} mentioned you in a comment', '/post/{{post_id}}')
ON CONFLICT (type) DO NOTHING;

-- Create indexes for better query performance on seed data
CREATE INDEX IF NOT EXISTS idx_hashtags_trending_score ON hashtags(trending_score DESC);
CREATE INDEX IF NOT EXISTS idx_hashtags_usage_count ON hashtags(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_game ON tournaments(game);
CREATE INDEX IF NOT EXISTS idx_user_achievements_category ON user_achievements(category);
CREATE INDEX IF NOT EXISTS idx_user_achievements_rarity ON user_achievements(rarity);

-- Update statistics for query planner
ANALYZE hashtags;
ANALYZE tournaments;
ANALYZE user_achievements;
ANALYZE leaderboards;

-- Set up some useful database functions for common operations
CREATE OR REPLACE FUNCTION get_user_skill_rating(user_uuid UUID, game_name VARCHAR)
RETURNS INTEGER AS $$
DECLARE
  skill_rating INTEGER;
BEGIN
  SELECT COALESCE(AVG(performance_metrics->>'skill_rating')::INTEGER, 1500)
  INTO skill_rating
  FROM game_sessions 
  WHERE user_id = user_uuid 
  AND game = game_name 
  AND performance_metrics->>'skill_rating' IS NOT NULL
  AND start_time > NOW() - INTERVAL '30 days';
  
  RETURN COALESCE(skill_rating, 1500);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_team_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update team statistics when game sessions are added
  UPDATE teams SET
    average_rating = (
      SELECT AVG(get_user_skill_rating(tm.user_id, teams.game))
      FROM team_members tm
      WHERE tm.team_id = teams.id
    ),
    updated_at = NOW()
  WHERE id IN (
    SELECT DISTINCT tm.team_id
    FROM team_members tm
    WHERE tm.user_id = NEW.user_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update team stats
CREATE TRIGGER update_team_stats_trigger
  AFTER INSERT OR UPDATE ON game_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_team_stats();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_user_skill_rating(UUID, VARCHAR) TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION get_user_skill_rating(UUID, VARCHAR) IS 'Calculate average skill rating for a user in a specific game over the last 30 days';
COMMENT ON TRIGGER update_team_stats_trigger ON game_sessions IS 'Automatically update team statistics when members play games';
