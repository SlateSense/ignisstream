-- =====================================================
-- DATABASE OPTIMIZATION FOR IGNISSTREAM
-- Advanced indexing, query optimization, and performance tuning
-- =====================================================

-- Enable performance monitoring
SELECT pg_stat_statements_reset();
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS btree_gin;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =====================================================
-- ADVANCED INDEXING STRATEGY
-- =====================================================

-- Posts table optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_user_created 
ON posts (user_id, created_at DESC) 
WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_game_performance 
ON posts (game_title, created_at DESC) 
WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_trending 
ON posts (likes_count DESC, created_at DESC) 
WHERE created_at > NOW() - INTERVAL '7 days' AND deleted_at IS NULL;

-- Full-text search index for posts
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_fts 
ON posts USING GIN (to_tsvector('english', title || ' ' || content));

-- Composite index for feed queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_feed_composite 
ON posts (user_id, game_title, created_at DESC) 
INCLUDE (title, content, likes_count, comments_count)
WHERE deleted_at IS NULL;

-- Users/Profiles optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_search 
ON profiles USING GIN (to_tsvector('english', display_name || ' ' || COALESCE(bio, '')));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_gaming 
ON profiles ((gaming_preferences->>'favorite_games'), (gaming_preferences->>'skill_level'))
WHERE gaming_preferences IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_location 
ON profiles ((profile_data->>'region'), (profile_data->>'country'))
WHERE profile_data IS NOT NULL;

-- Games table optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_games_popularity 
ON games (player_count DESC, rating DESC) 
WHERE active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_games_search 
ON games USING GIN (to_tsvector('english', title || ' ' || COALESCE(description, '') || ' ' || genre));

-- User games relationship optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_games_activity 
ON user_games (user_id, last_played DESC) 
INCLUDE (playtime_hours, achievements_unlocked);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_games_stats 
ON user_games (game_id, skill_rating DESC, playtime_hours DESC);

-- Messages optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_conversation 
ON messages (conversation_id, created_at DESC) 
WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_user_unread 
ON messages (recipient_id, read_at) 
WHERE read_at IS NULL AND deleted_at IS NULL;

-- Follows/Friends optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_follows_follower_status 
ON follows (follower_id, status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_follows_following_status 
ON follows (following_id, status, created_at DESC);

-- Streaming optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_streams_discovery 
ON streams (status, viewer_count DESC, started_at DESC) 
WHERE status = 'live';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_streams_user_history 
ON streams (user_id, started_at DESC);

-- Tournaments optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tournaments_active 
ON tournaments (status, start_date) 
WHERE status IN ('upcoming', 'active');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tournament_participants_ranking 
ON tournament_participants (tournament_id, final_ranking) 
WHERE final_ranking IS NOT NULL;

-- =====================================================
-- MATERIALIZED VIEWS FOR EXPENSIVE QUERIES
-- =====================================================

-- Trending games view
DROP MATERIALIZED VIEW IF EXISTS mv_trending_games;
CREATE MATERIALIZED VIEW mv_trending_games AS
SELECT 
    g.id,
    g.title,
    g.image_url,
    COUNT(DISTINCT ug.user_id) as active_players,
    COUNT(DISTINCT p.id) as recent_posts,
    AVG(ug.skill_rating) as avg_skill_rating,
    SUM(ug.playtime_hours) as total_playtime
FROM games g
LEFT JOIN user_games ug ON g.id = ug.game_id 
    AND ug.last_played > NOW() - INTERVAL '30 days'
LEFT JOIN posts p ON g.title = p.game_title 
    AND p.created_at > NOW() - INTERVAL '7 days'
    AND p.deleted_at IS NULL
WHERE g.active = true
GROUP BY g.id, g.title, g.image_url
HAVING COUNT(DISTINCT ug.user_id) > 0
ORDER BY active_players DESC, recent_posts DESC;

CREATE UNIQUE INDEX ON mv_trending_games (id);

-- User statistics view  
DROP MATERIALIZED VIEW IF EXISTS mv_user_stats;
CREATE MATERIALIZED VIEW mv_user_stats AS
SELECT 
    p.id as user_id,
    p.display_name,
    p.avatar_url,
    COUNT(DISTINCT posts.id) as total_posts,
    COALESCE(SUM(posts.likes_count), 0) as total_likes,
    COUNT(DISTINCT ug.game_id) as games_played,
    COALESCE(SUM(ug.playtime_hours), 0) as total_playtime,
    COUNT(DISTINCT f1.following_id) as following_count,
    COUNT(DISTINCT f2.follower_id) as followers_count,
    AVG(ug.skill_rating) as avg_skill_rating
FROM profiles p
LEFT JOIN posts ON p.id = posts.user_id AND posts.deleted_at IS NULL
LEFT JOIN user_games ug ON p.id = ug.user_id
LEFT JOIN follows f1 ON p.id = f1.follower_id AND f1.status = 'accepted'
LEFT JOIN follows f2 ON p.id = f2.following_id AND f2.status = 'accepted'
GROUP BY p.id, p.display_name, p.avatar_url;

CREATE UNIQUE INDEX ON mv_user_stats (user_id);

-- Leaderboards view
DROP MATERIALIZED VIEW IF EXISTS mv_game_leaderboards;
CREATE MATERIALIZED VIEW mv_game_leaderboards AS
SELECT 
    ug.game_id,
    g.title as game_title,
    ug.user_id,
    p.display_name,
    p.avatar_url,
    ug.skill_rating,
    ug.playtime_hours,
    ug.achievements_unlocked,
    ROW_NUMBER() OVER (PARTITION BY ug.game_id ORDER BY ug.skill_rating DESC) as ranking
FROM user_games ug
JOIN games g ON ug.game_id = g.id
JOIN profiles p ON ug.user_id = p.id
WHERE ug.skill_rating > 0 AND g.active = true;

CREATE INDEX ON mv_game_leaderboards (game_id, ranking);
CREATE INDEX ON mv_game_leaderboards (user_id);

-- =====================================================
-- QUERY OPTIMIZATION FUNCTIONS
-- =====================================================

-- Optimized feed function with pagination
CREATE OR REPLACE FUNCTION get_optimized_feed(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0,
    p_game_filter TEXT DEFAULT NULL
) RETURNS TABLE (
    id UUID,
    user_id UUID,
    display_name TEXT,
    avatar_url TEXT,
    title TEXT,
    content TEXT,
    image_url TEXT,
    video_url TEXT,
    game_title TEXT,
    likes_count INTEGER,
    comments_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    is_liked BOOLEAN
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    WITH feed_posts AS (
        SELECT DISTINCT p.id
        FROM posts p
        JOIN follows f ON p.user_id = f.following_id
        WHERE f.follower_id = p_user_id 
            AND f.status = 'accepted'
            AND p.deleted_at IS NULL
            AND (p_game_filter IS NULL OR p.game_title = p_game_filter)
        
        UNION ALL
        
        -- Include user's own posts
        SELECT p.id
        FROM posts p
        WHERE p.user_id = p_user_id
            AND p.deleted_at IS NULL
            AND (p_game_filter IS NULL OR p.game_title = p_game_filter)
        
        ORDER BY 1
        LIMIT p_limit OFFSET p_offset
    )
    SELECT 
        p.id,
        p.user_id,
        pr.display_name,
        pr.avatar_url,
        p.title,
        p.content,
        p.image_url,
        p.video_url,
        p.game_title,
        p.likes_count,
        p.comments_count,
        p.created_at,
        EXISTS(SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.user_id = p_user_id) as is_liked
    FROM feed_posts fp
    JOIN posts p ON fp.id = p.id
    JOIN profiles pr ON p.user_id = pr.id
    ORDER BY p.created_at DESC;
END;
$$;

-- Optimized search function
CREATE OR REPLACE FUNCTION search_content(
    p_query TEXT,
    p_user_id UUID DEFAULT NULL,
    p_content_type TEXT DEFAULT 'all',
    p_limit INTEGER DEFAULT 50
) RETURNS TABLE (
    result_type TEXT,
    id UUID,
    title TEXT,
    description TEXT,
    image_url TEXT,
    relevance REAL,
    metadata JSONB
) LANGUAGE plpgsql AS $$
DECLARE
    search_vector tsvector;
BEGIN
    search_vector := plainto_tsquery('english', p_query);
    
    RETURN QUERY
    -- Search posts
    SELECT 
        'post'::TEXT as result_type,
        p.id,
        p.title,
        LEFT(p.content, 200) as description,
        p.image_url,
        ts_rank(to_tsvector('english', p.title || ' ' || p.content), search_vector) as relevance,
        jsonb_build_object(
            'game_title', p.game_title,
            'likes_count', p.likes_count,
            'created_at', p.created_at,
            'author', pr.display_name
        ) as metadata
    FROM posts p
    JOIN profiles pr ON p.user_id = pr.id
    WHERE (p_content_type = 'all' OR p_content_type = 'posts')
        AND p.deleted_at IS NULL
        AND to_tsvector('english', p.title || ' ' || p.content) @@ search_vector
    
    UNION ALL
    
    -- Search users  
    SELECT 
        'user'::TEXT as result_type,
        pr.id,
        pr.display_name as title,
        COALESCE(pr.bio, '') as description,
        pr.avatar_url as image_url,
        ts_rank(to_tsvector('english', pr.display_name || ' ' || COALESCE(pr.bio, '')), search_vector) as relevance,
        jsonb_build_object(
            'followers_count', COALESCE(us.followers_count, 0),
            'total_posts', COALESCE(us.total_posts, 0),
            'games_played', COALESCE(us.games_played, 0)
        ) as metadata
    FROM profiles pr
    LEFT JOIN mv_user_stats us ON pr.id = us.user_id
    WHERE (p_content_type = 'all' OR p_content_type = 'users')
        AND to_tsvector('english', pr.display_name || ' ' || COALESCE(pr.bio, '')) @@ search_vector
    
    UNION ALL
    
    -- Search games
    SELECT 
        'game'::TEXT as result_type,
        g.id,
        g.title,
        COALESCE(g.description, '') as description,
        g.image_url,
        ts_rank(to_tsvector('english', g.title || ' ' || COALESCE(g.description, '') || ' ' || g.genre), search_vector) as relevance,
        jsonb_build_object(
            'genre', g.genre,
            'rating', g.rating,
            'active_players', COALESCE(tg.active_players, 0)
        ) as metadata
    FROM games g
    LEFT JOIN mv_trending_games tg ON g.id = tg.id
    WHERE (p_content_type = 'all' OR p_content_type = 'games')
        AND g.active = true
        AND to_tsvector('english', g.title || ' ' || COALESCE(g.description, '') || ' ' || g.genre) @@ search_vector
    
    ORDER BY relevance DESC
    LIMIT p_limit;
END;
$$;

-- =====================================================
-- PERFORMANCE MONITORING QUERIES
-- =====================================================

-- Query to find slow queries
CREATE OR REPLACE VIEW slow_queries AS
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements
ORDER BY mean_time DESC;

-- Index usage statistics
CREATE OR REPLACE VIEW index_usage AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Table statistics
CREATE OR REPLACE VIEW table_stats AS
SELECT 
    schemaname,
    tablename,
    n_tup_ins,
    n_tup_upd,
    n_tup_del,
    n_live_tup,
    n_dead_tup,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;

-- =====================================================
-- REFRESH MATERIALIZED VIEWS (Schedule these)
-- =====================================================

-- Function to refresh all materialized views
CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_trending_games;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_stats;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_game_leaderboards;
    
    -- Log refresh
    INSERT INTO system_logs (event_type, message, created_at)
    VALUES ('materialized_view_refresh', 'All materialized views refreshed', NOW());
END;
$$;

-- =====================================================
-- AUTOMATIC CLEANUP AND MAINTENANCE
-- =====================================================

-- Function to clean up old data
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    -- Delete old notifications (older than 30 days)
    DELETE FROM notifications 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    -- Delete old system logs (older than 90 days)
    DELETE FROM system_logs 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    -- Update statistics
    ANALYZE;
    
    -- Log cleanup
    INSERT INTO system_logs (event_type, message, created_at)
    VALUES ('data_cleanup', 'Old data cleanup completed', NOW());
END;
$$;

-- =====================================================
-- CONNECTION POOLING CONFIGURATION
-- =====================================================

-- Recommended PostgreSQL configuration for high performance
-- Add these to postgresql.conf:

/*
# Connection and Resource Settings
max_connections = 200
shared_buffers = 4GB
effective_cache_size = 12GB
work_mem = 16MB
maintenance_work_mem = 512MB

# Query Optimization
random_page_cost = 1.1
effective_io_concurrency = 200
max_worker_processes = 8
max_parallel_workers_per_gather = 4
max_parallel_workers = 8

# Write Performance
wal_buffers = 16MB
checkpoint_completion_target = 0.9
max_wal_size = 2GB
min_wal_size = 1GB

# Logging and Monitoring
log_min_duration_statement = 1000
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on
*/
