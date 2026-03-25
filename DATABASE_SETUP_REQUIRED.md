# ⚠️ DATABASE SETUP REQUIRED

## Current Issue

The application is trying to query database tables that don't exist or have incompatible schemas in your Supabase project.

## Errors You're Seeing:

1. **Posts table** - 400 error (schema mismatch)
2. **Achievements table** - 404 error (doesn't exist)
3. **Messages table** - 404 error (doesn't exist)
4. **Notifications table** - 400 error (schema mismatch)

## Quick Fix - Run Database Migration

### **Option 1: Use the Complete Social Media Database (Recommended)**

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/odireqkjlgwdvmtscfqn
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the contents of these SQL files **in order**:
   
   ```
   COMPLETE_SOCIAL_MEDIA_DATABASE.sql
   COMPLETE_SOCIAL_MEDIA_DATABASE_PART2.sql
   ```

5. Click **Run** for each file
6. Wait for the migration to complete

### **Option 2: Simplified Schema (Faster)**

If the complete schema is too large, I can create a minimal schema with just the essential tables:

- `profiles`
- `posts` (with simplified structure)
- `comments`
- `likes`
- `follows`
- `notifications` (simplified)

Would you like me to create this simplified version?

## What These Tables Do:

### Core Tables:
- **profiles** - User accounts and gaming stats
- **posts** - Main content (clips, screenshots, text posts)
- **comments** - Comments on posts
- **likes** - Like system for posts and comments
- **follows** - Follow/follower relationships

### Enhanced Features:
- **achievements** - Gaming achievements system
- **messages** - Direct messaging
- **notifications** - Notification center
- **hashtags** - Hashtag discovery
- **stories** - 24-hour stories
- **polls** - Interactive polls

## After Running the SQL:

1. Refresh your browser
2. The errors should disappear
3. You can start creating posts!

## Need Help?

If you're getting errors running the SQL:
1. Make sure you're running them in the correct order
2. Check that you have the correct project selected
3. Look for any red error messages in the SQL editor

Let me know if you want me to create a simpler schema or if you need help with the migration!
