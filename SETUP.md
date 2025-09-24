# ForgePlay Setup Guide

## Prerequisites
- Node.js 18+ installed
- Supabase account (free tier works)
- Mux account (optional for video, free tier available)

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Supabase
1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API
3. Copy your project URL and anon key

### 3. Configure Environment Variables
Create a `.env.local` file:
```bash
cp .env.example .env.local
```

Add your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Run Database Migrations
1. Go to Supabase Dashboard > SQL Editor
2. Copy contents of `supabase/migrations/001_initial_schema.sql`
3. Run the SQL

### 5. Setup Storage Buckets
In Supabase Dashboard > Storage, create these buckets:
- `avatars` (public)
- `posts` (public)
- `thumbnails` (public)

### 6. Configure Auth Providers (Optional)
In Supabase Dashboard > Authentication > Providers:
- Enable Email/Password
- Enable Google OAuth (add your client ID/secret)
- Enable Discord OAuth (add your client ID/secret)

### 7. Run Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Mux Setup (For Video)
1. Create account at [mux.com](https://mux.com)
2. Get API credentials from Settings > API Access
3. Add to `.env.local`:
```env
MUX_TOKEN_ID=your-token-id
MUX_TOKEN_SECRET=your-token-secret
MUX_WEBHOOK_SECRET=your-webhook-secret
```

## Features Available
- ✅ Landing page with hero, features, stats
- ✅ User authentication (signup/signin)
- ✅ Database schema for posts, likes, comments, follows
- 🚧 Feed and post creation (in progress)
- 🚧 Video upload and editing
- 🚧 Real-time chat
- 🚧 Gamification system

## Next Steps
1. Complete environment setup
2. Run migrations
3. Test authentication flow
4. Start creating posts!

## Troubleshooting
- If auth redirects fail, check your Supabase URL configuration
- For CORS issues, add `http://localhost:3000` to allowed origins in Supabase
- Check browser console for detailed error messages
