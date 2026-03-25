# OAuth Provider Configuration for IgnisStream

This document outlines how to configure OAuth providers in Supabase for the IgnisStream gaming platform.

## Required OAuth Providers

### 1. Google OAuth
**Purpose**: Primary authentication method, wide user adoption
**Scopes**: `openid`, `email`, `profile`

**Setup Instructions**:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `https://[your-project-ref].supabase.co/auth/v1/callback`
   - `http://localhost:3000/auth/callback` (for development)

**Supabase Configuration**:
```sql
-- In Supabase Dashboard > Authentication > Providers
Client ID: [Your Google Client ID]
Client Secret: [Your Google Client Secret]
```

### 2. Discord OAuth
**Purpose**: Gaming community integration, popular among gamers
**Scopes**: `identify`, `email`, `guilds`

**Setup Instructions**:
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create new application
3. Go to OAuth2 section
4. Add redirect URIs:
   - `https://[your-project-ref].supabase.co/auth/v1/callback`
   - `http://localhost:3000/auth/callback`

**Supabase Configuration**:
```sql
Client ID: [Your Discord Client ID]
Client Secret: [Your Discord Client Secret]
```

### 3. GitHub OAuth
**Purpose**: Developer community, code sharing integration
**Scopes**: `user:email`, `read:user`

**Setup Instructions**:
1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create new OAuth App
3. Set Authorization callback URL:
   - `https://[your-project-ref].supabase.co/auth/v1/callback`

**Supabase Configuration**:
```sql
Client ID: [Your GitHub Client ID]
Client Secret: [Your GitHub Client Secret]
```

### 4. Twitch OAuth
**Purpose**: Streaming integration, gaming content creators
**Scopes**: `user:read:email`

**Setup Instructions**:
1. Go to [Twitch Developers Console](https://dev.twitch.tv/console)
2. Create new application
3. Set OAuth Redirect URLs:
   - `https://[your-project-ref].supabase.co/auth/v1/callback`
   - `http://localhost:3000/auth/callback`

**Supabase Configuration**:
```sql
Client ID: [Your Twitch Client ID]
Client Secret: [Your Twitch Client Secret]
```

## Custom Claims Configuration

Add the following custom claims to enhance user profiles:

```sql
-- Custom claims function for enhanced user data
CREATE OR REPLACE FUNCTION auth.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  claims jsonb;
  user_role text;
  user_teams jsonb;
BEGIN
  -- Get user role
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = (event->>'user_id')::uuid;
  
  -- Get user teams
  SELECT jsonb_agg(jsonb_build_object('id', t.id, 'name', t.name, 'role', tm.role))
  INTO user_teams
  FROM public.team_members tm
  JOIN public.teams t ON t.id = tm.team_id
  WHERE tm.user_id = (event->>'user_id')::uuid
  AND tm.status = 'active';
  
  -- Build custom claims
  claims := jsonb_build_object(
    'user_role', COALESCE(user_role, 'user'),
    'teams', COALESCE(user_teams, '[]'::jsonb),
    'platform', 'ignisstream'
  );
  
  -- Merge with existing claims
  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION auth.custom_access_token_hook TO supabase_auth_admin;
```

## Provider-Specific Integrations

### Discord Rich Presence
```javascript
// Discord RPC integration for game status
const DiscordRPC = require('discord-rpc');
const client = new DiscordRPC.Client({ transport: 'ipc' });

client.on('ready', () => {
  client.setActivity({
    details: 'Playing Valorant',
    state: 'In Competitive Match',
    largeImageKey: 'valorant_logo',
    largeImageText: 'Valorant',
    smallImageKey: 'rank_immortal',
    smallImageText: 'Immortal 2',
    instance: false,
  });
});
```

### Twitch Integration
```javascript
// Twitch API integration for streamers
const twitchApi = {
  getStreamStatus: async (username) => {
    const response = await fetch(`https://api.twitch.tv/helix/streams?user_login=${username}`, {
      headers: {
        'Client-ID': process.env.TWITCH_CLIENT_ID,
        'Authorization': `Bearer ${accessToken}`
      }
    });
    return response.json();
  }
};
```

## Security Considerations

### Rate Limiting
```sql
-- Implement rate limiting for OAuth attempts
CREATE TABLE auth_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL,
  provider VARCHAR(50) NOT NULL,
  attempts INTEGER DEFAULT 1,
  first_attempt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_attempt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  blocked_until TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_auth_rate_limits_ip_provider ON auth_rate_limits(ip_address, provider);
```

### Fraud Prevention
```sql
-- Track authentication events for security monitoring
CREATE TABLE auth_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  event_type VARCHAR(50) NOT NULL,
  provider VARCHAR(50),
  ip_address INET,
  user_agent TEXT,
  country VARCHAR(2),
  city VARCHAR(100),
  success BOOLEAN NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_auth_events_user_id ON auth_events(user_id);
CREATE INDEX idx_auth_events_created_at ON auth_events(created_at DESC);
```

## Testing OAuth Flows

### Development Environment
```bash
# Test OAuth flow locally
curl -X POST 'http://localhost:54321/auth/v1/authorize' \
  -H 'Content-Type: application/json' \
  -d '{
    "provider": "google",
    "redirectTo": "http://localhost:3000/auth/callback"
  }'
```

### Production Checklist
- [ ] All redirect URIs updated to production domains
- [ ] Client secrets stored securely in Supabase dashboard
- [ ] Rate limiting configured
- [ ] Security monitoring enabled
- [ ] HTTPS enforced for all auth endpoints
- [ ] Cross-origin requests properly configured

## Monitoring and Analytics

### OAuth Success Rates
```sql
-- Query to monitor OAuth provider success rates
SELECT 
  provider,
  COUNT(*) as total_attempts,
  COUNT(*) FILTER (WHERE success = true) as successful_attempts,
  ROUND(
    (COUNT(*) FILTER (WHERE success = true)::DECIMAL / COUNT(*)) * 100, 
    2
  ) as success_rate_percent
FROM auth_events 
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY provider
ORDER BY success_rate_percent DESC;
```

### User Registration Sources
```sql
-- Track which OAuth providers are most popular
SELECT 
  raw_user_meta_data->>'provider' as provider,
  COUNT(*) as user_count,
  ROUND(
    (COUNT(*)::DECIMAL / (SELECT COUNT(*) FROM auth.users)) * 100,
    2
  ) as percentage
FROM auth.users 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY raw_user_meta_data->>'provider'
ORDER BY user_count DESC;
```

## Troubleshooting Common Issues

### Issue: "Invalid redirect URI"
**Solution**: Ensure the redirect URI in your OAuth app matches exactly what Supabase expects

### Issue: "Provider not configured"
**Solution**: Check that the provider is enabled in Supabase dashboard and has valid credentials

### Issue: "CORS errors during OAuth"
**Solution**: Configure CORS settings in Supabase dashboard under API settings

### Issue: "Missing email scope"
**Solution**: Verify that email scope is requested for the OAuth provider

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [OAuth 2.0 Security Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
- [Gaming Platform Authentication Patterns](https://auth0.com/blog/gaming-authentication-patterns)
