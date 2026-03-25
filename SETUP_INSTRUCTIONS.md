# IgnisStream Setup Instructions

## 🎮 Try Demo Mode (No Setup Required)
**Go to: http://localhost:3000/demo**

This will let you explore the full platform with mock data immediately!

## 🛠️ Full Database Setup

### Step 1: Copy the Database Schema

Go to `lib/supabase/schema.sql` and copy the entire content.

### Step 2: Set Up Supabase Database

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard
2. **Find your project**: `odireqkjlgwdvmtscfqn`
3. **Navigate to**: SQL Editor
4. **Paste and run the schema** from `lib/supabase/schema.sql`

### Step 3: Configure Authentication

In your Supabase dashboard:
1. Go to **Authentication → Settings**
2. **Disable "Enable email confirmations"** (for development)
3. Set **Site URL**: `http://localhost:3000`
4. Add **Redirect URLs**: `http://localhost:3000/**`

### Step 4: Enable Row Level Security

The schema includes RLS policies. In your Supabase dashboard:
1. Go to **Database → Tables**
2. For each table, ensure RLS is enabled
3. The policies are already defined in the schema

### Step 5: Test the Connection

1. Go to: http://localhost:3000/setup
2. Click "Test Connection"
3. Verify all green checkmarks

## 🔧 Environment Variables

Your `.env.local` is already configured with:
```
NEXT_PUBLIC_SUPABASE_URL=https://odireqkjlgwdvmtscfqn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your_key]
```

## 🚀 Quick Start Options

### Option 1: Demo Mode (Instant)
- Go to `http://localhost:3000/demo`
- Choose a demo character or create custom
- Explore all features immediately

### Option 2: Full Setup (Production Ready)
- Follow steps 1-5 above
- Full database with real authentication
- Production-ready configuration

## 📁 Important Files

- **Schema**: `lib/supabase/schema.sql` (285 lines of SQL)
- **Demo Mode**: `http://localhost:3000/demo`
- **Setup Page**: `http://localhost:3000/setup`
- **Health Check**: `http://localhost:3000/api/health`

## 🎯 What's Included

✅ **Gaming Platform Integration** (Steam, Epic, Xbox, PlayStation, Nintendo, GOG, Riot, Blizzard)
✅ **Social Media Features** (Posts, Comments, Likes, Follows)
✅ **Live Streaming System** (HLS, WebRTC, Chat)
✅ **Tournament Management** (Brackets, Registration, Prizes)
✅ **Real-time Features** (WebSockets, Live Updates)
✅ **ML-powered Analytics** (Skill Prediction, Performance Analysis)
✅ **Mobile App Foundation** (React Native, Cross-platform)
✅ **Enterprise Security** (OWASP Top 10 Protection)

## 🔍 Troubleshooting

**"Sign up failed" error?**
- Try demo mode first: `http://localhost:3000/demo`
- Or set up the database schema (steps above)

**Setup page not loading?**
- Make sure server is running: `npm run dev`
- Check: `http://localhost:3000`

**Schema file not found?**
- It's located at: `lib/supabase/schema.sql`
- 285 lines of complete database schema
