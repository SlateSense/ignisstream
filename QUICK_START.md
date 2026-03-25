# 🚀 IgnisStream Quick Start Guide

Get your gaming platform running in **5 minutes**!

## ⚡ Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)

## 🏃‍♂️ Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Name: `ignisstream`
3. Generate strong password
4. Wait 2-3 minutes for setup

### 3. Configure Environment
```bash
# Copy environment template
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 4. Setup Database
```bash
# Install Supabase CLI
npm install -g supabase

# Login and link project
supabase login
supabase link --project-ref your-project-ref

# Run automated database setup
npm run setup:db
```

### 5. Launch Platform
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

## 🔧 Optional: Gaming APIs

Add gaming platform integration by getting API keys:

### Steam (Recommended)
1. Get key: [steamcommunity.com/dev/apikey](https://steamcommunity.com/dev/apikey)
2. Add to `.env.local`: `NEXT_PUBLIC_STEAM_API_KEY=your_key`

### Discord OAuth (Recommended)
1. Create app: [discord.com/developers/applications](https://discord.com/developers/applications)
2. Add redirect: `https://your-project-ref.supabase.co/auth/v1/callback`
3. Add to `.env.local`:
   ```env
   SUPABASE_AUTH_EXTERNAL_DISCORD_CLIENT_ID=your_client_id
   SUPABASE_AUTH_EXTERNAL_DISCORD_SECRET=your_client_secret
   ```

## ✅ Validate Setup

Run validation to check everything is working:
```bash
npm run setup:validate
```

## 🎮 Test Your Platform

1. **Sign Up** - Create your account
2. **Connect Gaming Account** - Link Steam/Discord
3. **Create Post** - Share your first gaming moment
4. **Explore Features** - Try tournaments, streaming, friends

## 📱 Mobile App (Optional)

```bash
cd mobile
npm install
npm run web  # Preview in browser
```

## 🆘 Need Help?

- **Setup Issues**: Check `SETUP_GUIDE.md` for detailed instructions
- **Validation Fails**: Run `npm run setup:validate` for diagnostics
- **Database Issues**: Verify Supabase credentials and migrations

## 🎉 You're Ready!

Your IgnisStream platform includes:
- ✅ 8 Gaming Platform Integrations
- ✅ Real-time Features & WebSockets
- ✅ Live Streaming System
- ✅ Social Features & Friends
- ✅ Tournament Management
- ✅ Mobile App Support
- ✅ AI-Powered Analytics

**Start building your gaming community!** 🎮
