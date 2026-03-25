# 🚀 IgnisStream Platform Setup Guide

This guide will walk you through setting up your IgnisStream gaming platform from scratch.

## 📋 Prerequisites

- Node.js 18+ installed
- Git installed
- A Supabase account
- Gaming platform developer accounts (optional but recommended)

## 🗄️ Step 1: Supabase Project Setup

### 1.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `ignisstream` (or your preferred name)
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
5. Click "Create new project"
6. Wait for project to be ready (2-3 minutes)

### 1.2 Get Supabase Credentials
1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (starts with `https://`)
   - **Anon public key** (starts with `eyJ`)
   - **Service role key** (starts with `eyJ`) - Keep this secret!

### 1.3 Configure Authentication Providers
1. Go to **Authentication** → **Providers**
2. Enable **Google** (optional):
   - Get credentials from [Google Cloud Console](https://console.cloud.google.com)
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `https://your-project-ref.supabase.co/auth/v1/callback`
3. Enable **Discord** (recommended for gaming):
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Create new application
   - Go to OAuth2 → General
   - Add redirect URI: `https://your-project-ref.supabase.co/auth/v1/callback`
   - Copy Client ID and Client Secret

## 🔧 Step 2: Local Environment Setup

### 2.1 Install Dependencies
```bash
cd "c:\Users\OM\Desktop\Game Forge"
npm install
```

### 2.2 Create Environment File
```bash
cp .env.example .env.local
```

### 2.3 Configure Environment Variables
Edit `.env.local` with your values:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Discord OAuth (recommended)
SUPABASE_AUTH_EXTERNAL_DISCORD_CLIENT_ID=your_discord_client_id
SUPABASE_AUTH_EXTERNAL_DISCORD_SECRET=your_discord_client_secret

# Google OAuth (optional)
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=your_google_client_id
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=your_google_client_secret

# Game API Keys (get these from respective platforms)
NEXT_PUBLIC_STEAM_API_KEY=your_steam_api_key
NEXT_PUBLIC_EPIC_CLIENT_ID=your_epic_client_id
NEXT_PUBLIC_EPIC_CLIENT_SECRET=your_epic_client_secret
NEXT_PUBLIC_RIOT_API_KEY=your_riot_api_key
NEXT_PUBLIC_BLIZZARD_CLIENT_ID=your_blizzard_client_id
NEXT_PUBLIC_BLIZZARD_CLIENT_SECRET=your_blizzard_client_secret
NEXT_PUBLIC_PSN_CLIENT_ID=your_psn_client_id
NEXT_PUBLIC_PSN_CLIENT_SECRET=your_psn_client_secret
NEXT_PUBLIC_NINTENDO_CLIENT_ID=your_nintendo_client_id
NEXT_PUBLIC_NINTENDO_CLIENT_SECRET=your_nintendo_client_secret
NEXT_PUBLIC_GOG_CLIENT_ID=your_gog_client_id
NEXT_PUBLIC_GOG_CLIENT_SECRET=your_gog_client_secret

# Streaming (optional - for advanced streaming features)
RTMP_SERVER_URL=rtmp://stream.ignisstream.com/live
HLS_SERVER_URL=https://stream.ignisstream.com/hls

# Other
NEXTAUTH_SECRET=your_random_secret_here
NEXTAUTH_URL=http://localhost:3000
```

## 🗄️ Step 3: Database Migration

### 3.1 Install Supabase CLI
```bash
npm install -g supabase
```

### 3.2 Login to Supabase
```bash
supabase login
```

### 3.3 Link Your Project
```bash
supabase link --project-ref your-project-ref
```

### 3.4 Run Migrations
```bash
# Run all migrations in order
supabase db push
```

Or run them individually:
```bash
# Run each migration file
supabase db push --file supabase/migrations/001_initial_schema.sql
supabase db push --file supabase/migrations/002_storage_buckets.sql
supabase db push --file supabase/migrations/003_extended_schema.sql
supabase db push --file supabase/migrations/004_enhanced_gaming_features.sql
supabase db push --file supabase/migrations/004_enums_and_types.sql
supabase db push --file supabase/migrations/005_rls_policies.sql
supabase db push --file supabase/migrations/006_seed_data.sql
supabase db push --file supabase/migrations/007_database_functions.sql
```

### 3.5 Create Storage Buckets
In your Supabase dashboard, go to **Storage** and create these buckets:
- `avatars` (public)
- `posts` (public)
- `thumbnails` (public)
- `streams` (public)
- `vods` (public)

## 🎮 Step 4: Gaming API Setup

### 4.1 Steam Web API
1. Go to [Steam Web API](https://steamcommunity.com/dev/apikey)
2. Register for an API key
3. Add to your `.env.local` as `NEXT_PUBLIC_STEAM_API_KEY`

### 4.2 Epic Games API
1. Go to [Epic Games Developer Portal](https://dev.epicgames.com/)
2. Create an application
3. Get Client ID and Client Secret
4. Add to your `.env.local`

### 4.3 Riot Games API
1. Go to [Riot Developer Portal](https://developer.riotgames.com/)
2. Create an account and get API key
3. Add to your `.env.local` as `NEXT_PUBLIC_RIOT_API_KEY`

### 4.4 Other Gaming APIs (Optional)
- **Xbox Live**: Requires partnership program
- **PlayStation**: Requires developer agreement
- **Nintendo**: Requires developer account
- **Blizzard**: Available through Battle.net API
- **GOG**: Available through GOG Galaxy API

## 🚀 Step 5: Launch Application

### 5.1 Start Development Server
```bash
npm run dev
```

### 5.2 Open Application
Navigate to [http://localhost:3000](http://localhost:3000)

### 5.3 Test Core Features
1. **Sign Up**: Create a new account
2. **Profile**: Complete your profile setup
3. **Gaming Integration**: Connect at least one gaming platform
4. **Feed**: Create your first post
5. **Social**: Follow other users

## 📱 Step 6: Mobile App Setup (Optional)

### 6.1 Navigate to Mobile Directory
```bash
cd mobile
```

### 6.2 Install Mobile Dependencies
```bash
npm install
```

### 6.3 Configure Mobile Environment
Copy environment variables to `mobile/.env.local`

### 6.4 Start Mobile App
```bash
# For iOS
npm run ios

# For Android
npm run android

# For web preview
npm run web
```

## 🔧 Step 7: Production Deployment

### 7.1 Deploy Web App
```bash
# Build for production
npm run build

# Deploy to Vercel (recommended)
npx vercel --prod
```

### 7.2 Configure Production Environment
Update your production environment variables in your hosting platform.

### 7.3 Update Supabase URLs
Update redirect URLs in Supabase Auth settings to use your production domain.

## 🧪 Step 8: Testing & Verification

### 8.1 Test Authentication
- [ ] Sign up with email
- [ ] Sign in with OAuth providers
- [ ] Password reset functionality

### 8.2 Test Gaming Features
- [ ] Connect gaming accounts
- [ ] Import game data
- [ ] View statistics
- [ ] Real-time updates

### 8.3 Test Social Features
- [ ] Create posts
- [ ] Follow users
- [ ] Like and comment
- [ ] Real-time notifications

### 8.4 Test Streaming (if configured)
- [ ] Create stream
- [ ] Start/stop streaming
- [ ] Chat functionality
- [ ] VOD creation

## 🆘 Troubleshooting

### Common Issues

**Database Connection Error**
- Verify Supabase URL and keys
- Check if project is active
- Ensure RLS policies are applied

**Gaming API Errors**
- Verify API keys are correct
- Check rate limits
- Ensure proper OAuth setup

**Build Errors**
- Clear node_modules and reinstall
- Check TypeScript errors
- Verify all environment variables

**Authentication Issues**
- Check redirect URLs
- Verify OAuth provider setup
- Clear browser cache

## 📞 Support

If you encounter issues:
1. Check the console for error messages
2. Verify all environment variables
3. Ensure database migrations completed successfully
4. Check Supabase logs in the dashboard

## 🎉 Congratulations!

Your IgnisStream gaming platform is now ready! You have:
- ✅ Complete gaming platform with 8 API integrations
- ✅ Real-time features and WebSocket support
- ✅ Streaming capabilities
- ✅ Social networking features
- ✅ Mobile app support
- ✅ Production-ready architecture

Start building your gaming community! 🎮
