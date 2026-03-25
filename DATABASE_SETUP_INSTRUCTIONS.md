# 🗄️ Database Setup Instructions - IgnisStream

## Complete Guide to Setting Up Your Social Media Database

---

## 📋 Prerequisites

Before starting, ensure you have:
- ✅ Supabase account (free tier works fine)
- ✅ Project created in Supabase
- ✅ Access to SQL Editor in Supabase dashboard

---

## 🚀 Step-by-Step Setup

### **Step 1: Access Supabase SQL Editor**

1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query** to create a blank SQL script

### **Step 2: Run Database Schema Part 1**

1. Open `COMPLETE_SOCIAL_MEDIA_DATABASE.sql`
2. Copy the entire contents
3. Paste into Supabase SQL Editor
4. Click **Run** (or press Ctrl+Enter)
5. Wait for completion (should take 5-10 seconds)
6. ✅ Verify no errors appeared

**This creates:**
- Core tables (profiles, posts, comments)
- Social features (likes, bookmarks, shares, follows)
- Content features (hashtags, mentions, stories, polls)
- Messaging system (conversations, messages)
- Notifications system
- Moderation tools (reports, blocks)

### **Step 3: Run Database Schema Part 2**

1. Open `COMPLETE_SOCIAL_MEDIA_DATABASE_PART2.sql`
2. Copy the entire contents
3. Paste into a NEW query in Supabase SQL Editor
4. Click **Run** (or press Ctrl+Enter)
5. Wait for completion (should take 10-15 seconds)
6. ✅ Verify no errors appeared

**This creates:**
- Streaming tables (streams, stream_chat)
- Gaming integration (user_game_accounts, user_game_stats)
- Match history tracking
- Performance indexes (40+ indexes for optimization)
- Row Level Security policies (RLS)
- Seed data (sample games and tags)

### **Step 4: Set Up Storage Buckets**

For media uploads (images, videos), create storage buckets:

1. Go to **Storage** in Supabase dashboard
2. Click **New Bucket**
3. Create the following buckets:

#### **Bucket: `avatars`**
- Name: `avatars`
- Public: ✅ Yes
- File size limit: 5MB
- Allowed MIME types: `image/*`

#### **Bucket: `media`**
- Name: `media`
- Public: ✅ Yes
- File size limit: 50MB
- Allowed MIME types: `image/*`, `video/*`

#### **Bucket: `covers`**
- Name: `covers`
- Public: ✅ Yes
- File size limit: 10MB
- Allowed MIME types: `image/*`

### **Step 5: Configure Storage Policies**

For each bucket, set up these RLS policies:

#### **Policy 1: Public Read**
```sql
-- Allow anyone to read files
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'media');
```

#### **Policy 2: Authenticated Upload**
```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'media' 
  AND auth.role() = 'authenticated'
);
```

#### **Policy 3: Own Files Delete**
```sql
-- Allow users to delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

Repeat for each bucket (`avatars`, `media`, `covers`).

---

## ✅ Verification Checklist

After setup, verify everything is working:

### **1. Check Tables Created**
Run this query to count tables:
```sql
SELECT COUNT(*) as table_count 
FROM information_schema.tables 
WHERE table_schema = 'public';
```
Expected result: **30+ tables**

### **2. Check RLS Enabled**
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('posts', 'profiles', 'comments', 'messages');
```
All should show `rowsecurity = true`

### **3. Check Indexes Created**
```sql
SELECT COUNT(*) as index_count 
FROM pg_indexes 
WHERE schemaname = 'public';
```
Expected result: **40+ indexes**

### **4. Check Seed Data**
```sql
SELECT COUNT(*) FROM games;
SELECT COUNT(*) FROM tags;
```
Expected: **8 games**, **10 tags**

### **5. Test Storage Buckets**
```sql
SELECT * FROM storage.buckets;
```
Should see: `avatars`, `media`, `covers`

---

## 🔧 Troubleshooting

### **Error: "relation already exists"**
- **Solution**: Tables already created. Either skip or drop old tables first.
- **Drop command**: Included in SQL files (`DROP TABLE IF EXISTS...`)

### **Error: "permission denied"**
- **Solution**: Check you're running in Supabase SQL Editor, not local psql
- Supabase automatically has necessary permissions

### **Error: "syntax error near..."**
- **Solution**: Ensure you copied the ENTIRE file contents
- Check no extra characters were added during copy/paste

### **RLS Policies Not Working**
- **Solution**: Verify RLS is enabled on tables
- Run: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`

### **Storage Upload Fails**
- **Solution**: Check bucket policies are set up correctly
- Verify bucket is set to public
- Check file size limits

---

## 🔄 Resetting Database (Clean Slate)

If you need to start over:

### **Option 1: Drop All Tables**
```sql
-- WARNING: This deletes ALL data!
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

Then re-run both SQL files.

### **Option 2: Reset Project**
1. Go to Supabase project settings
2. Scroll to "Danger Zone"
3. Click "Pause project" then "Resume"
4. Re-run setup scripts

---

## 📊 Database Schema Overview

### **Table Categories:**

#### **User & Profile** (2 tables)
- `profiles` - User accounts and profiles
- `user_online_status` - Track who's online

#### **Content** (5 tables)
- `posts` - Main content posts
- `comments` - Post comments
- `stories` - 24-hour stories
- `polls` - Interactive polls
- `poll_votes` - Poll voting records

#### **Interactions** (6 tables)
- `post_likes` - Like posts
- `comment_likes` - Like comments
- `bookmarks` - Save posts
- `saved_collections` - Organize saves
- `shares` - Share/repost
- `post_views` - View tracking

#### **Social** (3 tables)
- `follows` - Follow relationships
- `blocks` - Blocked users
- `mentions` - @mentions

#### **Discovery** (4 tables)
- `hashtags` - Hashtag system
- `post_hashtags` - Link posts to tags
- `games` - Game database
- `tags` - Content tags

#### **Messaging** (3 tables)
- `conversations` - Chat conversations
- `conversation_participants` - Who's in chat
- `messages` - Direct messages

#### **Notifications** (1 table)
- `notifications` - All notification types

#### **Moderation** (2 tables)
- `reports` - Content reports
- `blocks` - User blocks

#### **Streaming** (2 tables)
- `streams` - Live streams
- `stream_chat` - Stream chat messages

#### **Gaming** (3 tables)
- `user_game_accounts` - Connected platforms
- `user_game_stats` - Game statistics
- `match_history` - Match records

#### **Stories** (2 tables)
- `stories` - Story content
- `story_views` - Who viewed stories

---

## 🎯 Post-Setup Configuration

### **1. Set Up Authentication**

Enable authentication providers in Supabase:
1. Go to **Authentication** → **Providers**
2. Enable:
   - ✅ Email
   - ✅ Google (optional)
   - ✅ Discord (optional)
   - ✅ Twitch (optional)

### **2. Configure SMTP (Email)**

For email notifications:
1. Go to **Project Settings** → **Auth**
2. Configure SMTP settings
3. Or use Supabase default email

### **3. Set Up Edge Functions (Optional)**

For advanced features:
```bash
supabase functions new notifications
supabase functions new image-processing
```

### **4. Enable Realtime**

For live updates:
1. Go to **Database** → **Replication**
2. Enable realtime for:
   - `messages`
   - `notifications`
   - `stream_chat`
   - `posts`

---

## 📈 Performance Optimization

Already included in schema:
- ✅ **40+ indexes** for fast queries
- ✅ **Text search indexes** (GIN indexes)
- ✅ **Foreign key indexes**
- ✅ **Composite indexes** for common queries

### **Monitor Performance:**
```sql
-- Check slow queries
SELECT * FROM pg_stat_statements 
ORDER BY total_exec_time DESC 
LIMIT 10;

-- Check index usage
SELECT * FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

---

## 🔒 Security Configuration

### **Already Implemented:**
- ✅ Row Level Security on all tables
- ✅ Policies for read/write/delete
- ✅ User isolation (users can only modify their own data)
- ✅ Public vs private content filtering

### **Additional Security (Recommended):**

#### **1. Rate Limiting**
Configure in `supabase/config.toml`:
```toml
[api]
max_rows = 1000
```

#### **2. Enable SSL**
Always enabled on Supabase by default

#### **3. Environment Variables**
Never commit:
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- Any API keys

---

## 🎉 You're Done!

Your database is now fully set up with:
- ✅ All tables created
- ✅ Indexes optimized
- ✅ Security policies enabled
- ✅ Storage buckets ready
- ✅ Seed data loaded

### **Next Steps:**
1. Configure your `.env.local` file
2. Run the development server
3. Create your first user account
4. Start building your community!

---

## 📞 Need Help?

- 📚 **Supabase Docs**: https://supabase.com/docs
- 💬 **Discord**: https://discord.supabase.com
- 🐛 **GitHub Issues**: Report any problems

---

**Happy Building! 🚀**
