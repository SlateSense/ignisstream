-- Advanced database functions for IgnisStream platform
-- This migration adds utility functions and procedures for complex operations

-- Function to calculate user performance metrics
CREATE OR REPLACE FUNCTION calculate_user_performance_metrics(user_uuid UUID, game_name VARCHAR, days_back INTEGER DEFAULT 30)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  total_sessions INTEGER;
  avg_kdr DECIMAL;
  avg_accuracy DECIMAL;
  total_kills INTEGER;
  total_deaths INTEGER;
  total_assists INTEGER;
  win_rate DECIMAL;
  improvement_rate DECIMAL;
  consistency_score DECIMAL;
BEGIN
  -- Get basic stats
  SELECT 
    COUNT(*),
    AVG(kdr),
    AVG(accuracy),
    SUM(kills),
    SUM(deaths),
    SUM(assists)
  INTO total_sessions, avg_kdr, avg_accuracy, total_kills, total_deaths, total_assists
  FROM game_sessions 
  WHERE user_id = user_uuid 
    AND game = game_name 
    AND start_time >= NOW() - (days_back || ' days')::INTERVAL
    AND end_time IS NOT NULL;

  -- Calculate win rate (assuming wins are tracked in performance_metrics)
  SELECT AVG((performance_metrics->>'won')::BOOLEAN::INTEGER) * 100
  INTO win_rate
  FROM game_sessions
  WHERE user_id = user_uuid 
    AND game = game_name 
    AND start_time >= NOW() - (days_back || ' days')::INTERVAL
    AND performance_metrics->>'won' IS NOT NULL;

  -- Calculate improvement rate (skill rating trend)
  WITH skill_progression AS (
    SELECT 
      (performance_metrics->>'skill_rating')::INTEGER as rating,
      ROW_NUMBER() OVER (ORDER BY start_time) as session_num
    FROM game_sessions
    WHERE user_id = user_uuid 
      AND game = game_name 
      AND start_time >= NOW() - (days_back || ' days')::INTERVAL
      AND performance_metrics->>'skill_rating' IS NOT NULL
  ),
  regression AS (
    SELECT 
      regr_slope(rating, session_num) as slope
    FROM skill_progression
  )
  SELECT COALESCE(slope, 0) INTO improvement_rate FROM regression;

  -- Calculate consistency score (inverse of performance variance)
  WITH performance_variance AS (
    SELECT VAR_POP(kdr) as kdr_variance
    FROM game_sessions
    WHERE user_id = user_uuid 
      AND game = game_name 
      AND start_time >= NOW() - (days_back || ' days')::INTERVAL
      AND kdr IS NOT NULL
  )
  SELECT GREATEST(0, 100 - (COALESCE(kdr_variance, 0) * 10))
  INTO consistency_score 
  FROM performance_variance;

  -- Build result JSON
  result := jsonb_build_object(
    'total_sessions', COALESCE(total_sessions, 0),
    'avg_kdr', COALESCE(avg_kdr, 0),
    'avg_accuracy', COALESCE(avg_accuracy, 0),
    'total_kills', COALESCE(total_kills, 0),
    'total_deaths', COALESCE(total_deaths, 0),
    'total_assists', COALESCE(total_assists, 0),
    'win_rate', COALESCE(win_rate, 0),
    'improvement_rate', COALESCE(improvement_rate, 0),
    'consistency_score', COALESCE(consistency_score, 50),
    'calculated_at', NOW()
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update leaderboard rankings
CREATE OR REPLACE FUNCTION update_leaderboard_rankings(leaderboard_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER := 0;
BEGIN
  -- Update rankings based on score
  WITH ranked_entries AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (ORDER BY score DESC, last_updated ASC) as new_rank
    FROM leaderboard_entries
    WHERE leaderboard_id = leaderboard_uuid
  )
  UPDATE leaderboard_entries le
  SET 
    previous_rank = rank,
    rank = re.new_rank,
    last_updated = NOW()
  FROM ranked_entries re
  WHERE le.id = re.id 
    AND le.rank != re.new_rank;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  -- Update leaderboard last updated timestamp
  UPDATE leaderboards 
  SET updated_at = NOW() 
  WHERE id = leaderboard_uuid;

  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and award achievements
CREATE OR REPLACE FUNCTION check_and_award_achievements(user_uuid UUID, trigger_event VARCHAR, event_data JSONB DEFAULT '{}')
RETURNS INTEGER AS $$
DECLARE
  awarded_count INTEGER := 0;
  achievement_record RECORD;
BEGIN
  -- Check for kill-based achievements
  IF trigger_event = 'game_session_completed' THEN
    -- First Kill achievement
    IF NOT EXISTS (SELECT 1 FROM user_achievements WHERE user_id = user_uuid AND achievement_id = 'first_kill') 
       AND (event_data->>'kills')::INTEGER > 0 THEN
      INSERT INTO user_achievements (user_id, achievement_id, name, description, icon, rarity, category)
      VALUES (user_uuid, 'first_kill', 'First Blood', 'Get your first kill in any game', 'trophy', 'common', 'skill');
      awarded_count := awarded_count + 1;
    END IF;

    -- Ace achievement (5+ kills in one session)
    IF NOT EXISTS (SELECT 1 FROM user_achievements WHERE user_id = user_uuid AND achievement_id = 'ace_master')
       AND (event_data->>'kills')::INTEGER >= 5 THEN
      INSERT INTO user_achievements (user_id, achievement_id, name, description, icon, rarity, category)
      VALUES (user_uuid, 'ace_master', 'Ace Master', 'Get 5 or more kills in a single match', 'crown', 'epic', 'skill');
      awarded_count := awarded_count + 1;
    END IF;

    -- Perfect accuracy achievement
    IF NOT EXISTS (SELECT 1 FROM user_achievements WHERE user_id = user_uuid AND achievement_id = 'perfectionist')
       AND (event_data->>'accuracy')::DECIMAL = 100.0 THEN
      INSERT INTO user_achievements (user_id, achievement_id, name, description, icon, rarity, category)
      VALUES (user_uuid, 'perfectionist', 'Perfectionist', 'Achieve 100% accuracy in a match', 'check-circle', 'epic', 'skill');
      awarded_count := awarded_count + 1;
    END IF;
  END IF;

  -- Check for social achievements
  IF trigger_event = 'team_joined' THEN
    IF NOT EXISTS (SELECT 1 FROM user_achievements WHERE user_id = user_uuid AND achievement_id = 'team_player') THEN
      INSERT INTO user_achievements (user_id, achievement_id, name, description, icon, rarity, category)
      VALUES (user_uuid, 'team_player', 'Team Player', 'Join your first team', 'users', 'common', 'social');
      awarded_count := awarded_count + 1;
    END IF;
  END IF;

  -- Check for content creation achievements
  IF trigger_event = 'clip_uploaded' THEN
    IF NOT EXISTS (SELECT 1 FROM user_achievements WHERE user_id = user_uuid AND achievement_id = 'content_creator') THEN
      INSERT INTO user_achievements (user_id, achievement_id, name, description, icon, rarity, category)
      VALUES (user_uuid, 'content_creator', 'Content Creator', 'Upload your first clip', 'video', 'common', 'social');
      awarded_count := awarded_count + 1;
    END IF;
  END IF;

  RETURN awarded_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user statistics dashboard
CREATE OR REPLACE FUNCTION get_user_dashboard_stats(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  total_posts INTEGER;
  total_followers INTEGER;
  total_following INTEGER;
  total_achievements INTEGER;
  recent_matches INTEGER;
  best_game VARCHAR;
  current_streak INTEGER;
BEGIN
  -- Get basic counts
  SELECT COUNT(*) INTO total_posts FROM posts WHERE user_id = user_uuid;
  SELECT COUNT(*) INTO total_followers FROM follows WHERE following_id = user_uuid AND status = 'accepted';
  SELECT COUNT(*) INTO total_following FROM follows WHERE follower_id = user_uuid AND status = 'accepted';
  SELECT COUNT(*) INTO total_achievements FROM user_achievements WHERE user_id = user_uuid;
  
  -- Get recent matches (last 7 days)
  SELECT COUNT(*) INTO recent_matches 
  FROM game_sessions 
  WHERE user_id = user_uuid 
    AND start_time >= NOW() - INTERVAL '7 days';

  -- Get best performing game
  SELECT game INTO best_game
  FROM game_sessions
  WHERE user_id = user_uuid
  GROUP BY game
  ORDER BY AVG(kdr) DESC, COUNT(*) DESC
  LIMIT 1;

  -- Get current longest active streak
  SELECT COALESCE(MAX(current_count), 0) INTO current_streak
  FROM user_streaks
  WHERE user_id = user_uuid AND is_active = true;

  -- Build result
  result := jsonb_build_object(
    'total_posts', total_posts,
    'total_followers', total_followers,
    'total_following', total_following,
    'total_achievements', total_achievements,
    'recent_matches', recent_matches,
    'best_game', best_game,
    'current_streak', current_streak,
    'generated_at', NOW()
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate team compatibility score
CREATE OR REPLACE FUNCTION calculate_team_compatibility(team_uuid UUID, user_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
  compatibility_score DECIMAL := 0;
  team_record RECORD;
  user_stats JSONB;
  skill_diff INTEGER;
  playtime_overlap DECIMAL;
BEGIN
  -- Get team info
  SELECT * INTO team_record FROM teams WHERE id = team_uuid;
  
  -- Get user performance stats
  SELECT calculate_user_performance_metrics(user_uuid, team_record.game) INTO user_stats;
  
  -- Calculate skill compatibility (closer skill = higher score)
  skill_diff := ABS(team_record.average_rating - (user_stats->>'avg_skill_rating')::INTEGER);
  compatibility_score := compatibility_score + GREATEST(0, 100 - (skill_diff / 50.0));
  
  -- Calculate region compatibility
  IF EXISTS (SELECT 1 FROM profiles WHERE id = user_uuid AND region = team_record.region) THEN
    compatibility_score := compatibility_score + 20;
  END IF;
  
  -- Calculate language compatibility
  IF EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = user_uuid 
    AND p.languages && team_record.language
  ) THEN
    compatibility_score := compatibility_score + 15;
  END IF;
  
  -- Calculate play style compatibility (placeholder - would need more complex logic)
  compatibility_score := compatibility_score + 10;
  
  -- Normalize to 0-100 scale
  RETURN LEAST(100, compatibility_score / 1.45);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate match history insights
CREATE OR REPLACE FUNCTION generate_match_insights(user_uuid UUID, game_name VARCHAR, limit_count INTEGER DEFAULT 10)
RETURNS JSONB AS $$
DECLARE
  insights JSONB;
  best_performance RECORD;
  worst_performance RECORD;
  favorite_map VARCHAR;
  peak_hour INTEGER;
  improvement_trend VARCHAR;
BEGIN
  -- Get best performance
  SELECT * INTO best_performance
  FROM game_sessions
  WHERE user_id = user_uuid AND game = game_name
  ORDER BY kdr DESC, score DESC
  LIMIT 1;

  -- Get worst performance
  SELECT * INTO worst_performance
  FROM game_sessions
  WHERE user_id = user_uuid AND game = game_name
  ORDER BY kdr ASC, score ASC
  LIMIT 1;

  -- Get favorite map
  SELECT performance_metrics->>'map' INTO favorite_map
  FROM game_sessions
  WHERE user_id = user_uuid 
    AND game = game_name
    AND performance_metrics->>'map' IS NOT NULL
  GROUP BY performance_metrics->>'map'
  ORDER BY COUNT(*) DESC, AVG(kdr) DESC
  LIMIT 1;

  -- Get peak performance hour
  SELECT EXTRACT(HOUR FROM start_time) INTO peak_hour
  FROM game_sessions
  WHERE user_id = user_uuid AND game = game_name
  GROUP BY EXTRACT(HOUR FROM start_time)
  ORDER BY AVG(kdr) DESC
  LIMIT 1;

  -- Determine improvement trend
  WITH recent_performance AS (
    SELECT kdr, ROW_NUMBER() OVER (ORDER BY start_time DESC) as recency
    FROM game_sessions
    WHERE user_id = user_uuid AND game = game_name
    LIMIT 10
  ),
  trend_calc AS (
    SELECT 
      AVG(CASE WHEN recency <= 5 THEN kdr END) as recent_avg,
      AVG(CASE WHEN recency > 5 THEN kdr END) as older_avg
    FROM recent_performance
  )
  SELECT 
    CASE 
      WHEN recent_avg > older_avg * 1.1 THEN 'improving'
      WHEN recent_avg < older_avg * 0.9 THEN 'declining'
      ELSE 'stable'
    END
  INTO improvement_trend
  FROM trend_calc;

  -- Build insights JSON
  insights := jsonb_build_object(
    'best_match', jsonb_build_object(
      'kdr', best_performance.kdr,
      'kills', best_performance.kills,
      'score', best_performance.score,
      'date', best_performance.start_time
    ),
    'areas_for_improvement', jsonb_build_object(
      'lowest_kdr', worst_performance.kdr,
      'common_mistakes', 'Analysis based on worst performance patterns'
    ),
    'preferences', jsonb_build_object(
      'favorite_map', favorite_map,
      'peak_hour', peak_hour,
      'preferred_game_mode', 'competitive'
    ),
    'trends', jsonb_build_object(
      'improvement_direction', improvement_trend,
      'consistency_rating', 'calculated_separately'
    ),
    'generated_at', NOW()
  );

  RETURN insights;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old data
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS TEXT AS $$
DECLARE
  deleted_sessions INTEGER;
  deleted_notifications INTEGER;
  cleanup_report TEXT;
BEGIN
  -- Delete game sessions older than 1 year
  DELETE FROM game_sessions 
  WHERE start_time < NOW() - INTERVAL '1 year';
  GET DIAGNOSTICS deleted_sessions = ROW_COUNT;

  -- Delete read notifications older than 30 days
  DELETE FROM notifications 
  WHERE read_at IS NOT NULL 
    AND read_at < NOW() - INTERVAL '30 days';
  GET DIAGNOSTICS deleted_notifications = ROW_COUNT;

  -- Delete expired user sessions
  DELETE FROM user_sessions 
  WHERE expires_at < NOW();

  -- Update statistics
  ANALYZE;

  cleanup_report := format(
    'Cleanup completed: %s old game sessions, %s old notifications removed',
    deleted_sessions,
    deleted_notifications
  );

  RETURN cleanup_report;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule cleanup to run daily
SELECT cron.schedule('daily-cleanup', '0 2 * * *', 'SELECT cleanup_old_data();');

-- Grant permissions to authenticated users
GRANT EXECUTE ON FUNCTION calculate_user_performance_metrics(UUID, VARCHAR, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_dashboard_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_team_compatibility(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_match_insights(UUID, VARCHAR, INTEGER) TO authenticated;

-- Grant admin functions to service role
GRANT EXECUTE ON FUNCTION update_leaderboard_rankings(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION check_and_award_achievements(UUID, VARCHAR, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_old_data() TO service_role;

-- Add function comments
COMMENT ON FUNCTION calculate_user_performance_metrics(UUID, VARCHAR, INTEGER) IS 'Calculate comprehensive performance metrics for a user in a specific game';
COMMENT ON FUNCTION update_leaderboard_rankings(UUID) IS 'Recalculate and update all rankings for a specific leaderboard';
COMMENT ON FUNCTION check_and_award_achievements(UUID, VARCHAR, JSONB) IS 'Check if user qualifies for achievements based on trigger events';
COMMENT ON FUNCTION get_user_dashboard_stats(UUID) IS 'Get aggregated statistics for user dashboard display';
COMMENT ON FUNCTION calculate_team_compatibility(UUID, UUID) IS 'Calculate how well a user would fit with a specific team';
COMMENT ON FUNCTION generate_match_insights(UUID, VARCHAR, INTEGER) IS 'Generate AI-like insights about user performance patterns';
COMMENT ON FUNCTION cleanup_old_data() IS 'Cleanup old data to maintain database performance';
