# IgnisStream Supabase Setup Guide

This guide will help you set up the complete Supabase backend for the IgnisStream gaming platform.

## Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/cli) installed
- [Docker](https://www.docker.com/) installed (for local development)
- Node.js 18+ installed

## Quick Setup

### 1. Initialize Supabase Project

```bash
# Clone the repository
git clone https://github.com/slatesense/ignisstream.git
cd ignisstream

# Initialize Supabase
supabase init

# Link to your Supabase project (create one at https://supabase.com/dashboard)
supabase link --project-ref YOUR_PROJECT_REF
```

### 2. Environment Configuration

Create your environment files:

```bash
# Copy environment templates
cp .env.example .env.local
cp supabase/.env.example supabase/.env.local
```

Update `.env.local` with your Supabase credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OAuth Providers (optional for development)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
TWITCH_CLIENT_ID=your_twitch_client_id
TWITCH_CLIENT_SECRET=your_twitch_client_secret
```

### 3. Database Setup

Run the migrations to set up your database:

```bash
# Start local Supabase (for development)
supabase start

# Run migrations
supabase db push

# Or run them individually
supabase migration up
```

### 4. Storage Bucket Setup

The storage buckets will be created automatically by the migration, but you can also create them manually:

```bash
# Create storage buckets via CLI
supabase storage create avatars --public
supabase storage create posts --public  
supabase storage create thumbnails --public
supabase storage create team-assets --public
supabase storage create game-assets --public
```

### 5. OAuth Provider Configuration

Follow the [OAuth Providers Guide](../config/oauth-providers.md) to set up authentication providers.

## Database Schema Overview

### Core Tables

- **profiles** - Extended user profiles with gaming preferences
- **posts** - User-generated content (clips, images, text)
- **games** - Supported games database
- **hashtags** - Content categorization and trending

### Team System

- **teams** - Gaming teams/clans
- **team_members** - Team membership with roles
- **team_applications** - Join requests
- **team_events** - Practices, scrimmages, tournaments

### Competitive Features

- **leaderboards** - Ranking systems per game
- **leaderboard_entries** - Individual player rankings
- **tournaments** - Competitive events
- **tournament_participants** - Tournament registrations

### Gaming Analytics

- **game_sessions** - Individual gaming sessions with performance data
- **user_achievements** - Achievement system
- **user_badges** - Special recognition badges
- **user_streaks** - Performance streaks

### Content Creation

- **video_clips** - Uploaded gaming clips
- **clip_editing_projects** - Video editing projects
- **ai_tags** - AI-generated content tags

## Development Workflow

### Local Development

```bash
# Start local stack
supabase start

# View local dashboard
open http://localhost:54323

# Reset database (if needed)
supabase db reset

# Generate TypeScript types
supabase gen types typescript --local > types/database.ts
```

### Testing

```bash
# Run database tests
supabase test run

# Test specific migration
supabase migration repair --dry-run
```

### Production Deployment

```bash
# Deploy to production
supabase db push --password YOUR_DB_PASSWORD

# Deploy storage policies
supabase storage update
```

## Storage Configuration

### Bucket Policies

Each storage bucket has specific RLS policies:

- **avatars**: Users can manage their own avatars
- **posts**: Users can upload content, public viewing
- **thumbnails**: Auto-generated thumbnails
- **team-assets**: Team leaders can manage team media
- **game-assets**: Admin-only game-related assets

### File Upload Limits

- Avatars: 5MB (images only)
- Posts: 100MB (images/videos)
- Thumbnails: 2MB (compressed images)
- Team Assets: 10MB (logos/banners)
- Game Assets: 50MB (game media)

## Security Configuration

### Row Level Security (RLS)

All tables have RLS enabled with appropriate policies:

- Users can only modify their own data
- Public content is viewable by everyone
- Team data is restricted to team members
- Admin functions require special permissions

### API Security

- Rate limiting on authentication endpoints
- CORS configured for web/mobile apps
- JWT tokens with custom claims
- Audit logging for sensitive operations

## Monitoring and Maintenance

### Performance Monitoring

```sql
-- Check database performance
SELECT schemaname, tablename, n_tup_ins, n_tup_upd, n_tup_del 
FROM pg_stat_user_tables 
ORDER BY n_tup_ins + n_tup_upd + n_tup_del DESC;

-- Monitor storage usage
SELECT bucket_id, SUM(metadata->>'size')::bigint as total_size
FROM storage.objects 
GROUP BY bucket_id;
```

### Backup Strategy

- Daily automated backups via Supabase
- Point-in-time recovery available
- Critical data replicated across regions
- Export capabilities for data portability

### Scaling Considerations

- Database connection pooling configured
- Read replicas for analytics queries
- CDN integration for media files
- Horizontal scaling for storage buckets

## Troubleshooting

### Common Issues

**Migration Fails**
```bash
# Check migration status
supabase migration list

# Fix broken migration
supabase migration repair
```

**Storage Upload Issues**
```bash
# Check bucket policies
supabase storage ls

# Update storage policies
supabase storage update --policy-file policies.sql
```

**Performance Issues**
```bash
# Analyze query performance
supabase logs

# Update table statistics
ANALYZE;
```

### Support Resources

- [Supabase Documentation](https://supabase.com/docs)
- [IgnisStream Discord](https://discord.gg/ignisstream)
- [GitHub Issues](https://github.com/slatesense/ignisstream/issues)

## Advanced Configuration

### Custom Functions

The platform includes several custom database functions:

- `calculate_user_performance_metrics()` - Gaming performance analysis
- `update_leaderboard_rankings()` - Competitive ranking updates
- `check_and_award_achievements()` - Achievement system automation
- `generate_match_insights()` - AI-powered game analysis

### Webhooks

Configure webhooks for real-time features:

```bash
# Set up Discord webhooks for team notifications
supabase functions deploy discord-webhook

# Configure Twitch integration
supabase functions deploy twitch-integration
```

### Analytics Integration

```sql
-- Enable analytics tracking
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Set up materialized views for dashboards
CREATE MATERIALIZED VIEW daily_active_users AS
SELECT DATE(last_seen) as date, COUNT(DISTINCT id) as active_users
FROM profiles
WHERE last_seen >= NOW() - INTERVAL '30 days'
GROUP BY DATE(last_seen);
```

## Next Steps

1. Complete OAuth provider setup
2. Deploy to production Supabase project
3. Configure CDN for media files
4. Set up monitoring dashboards
5. Implement backup verification
6. Load test the database schema
7. Configure audit logging
8. Set up alerting for critical events

For additional help, consult the platform documentation or reach out to the development team.
