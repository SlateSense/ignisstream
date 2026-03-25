/**
 * Content Parser Utilities
 * Extract hashtags, mentions, and format text for social media posts
 */

import { createClient } from "@/lib/supabase/client";

export interface ParsedContent {
  text: string;
  hashtags: string[];
  mentions: string[];
}

/**
 * Extract hashtags from text
 */
export function extractHashtags(text: string): string[] {
  const hashtagRegex = /#[\w]+/g;
  const matches = text.match(hashtagRegex);
  if (!matches) return [];
  
  // Remove # and convert to lowercase, remove duplicates
  return [...new Set(matches.map(tag => tag.slice(1).toLowerCase()))];
}

/**
 * Extract mentions from text
 */
export function extractMentions(text: string): string[] {
  const mentionRegex = /@[\w]+/g;
  const matches = text.match(mentionRegex);
  if (!matches) return [];
  
  // Remove @ and convert to lowercase, remove duplicates
  return [...new Set(matches.map(mention => mention.slice(1).toLowerCase()))];
}

/**
 * Parse content and extract hashtags and mentions
 */
export function parseContent(text: string): ParsedContent {
  return {
    text,
    hashtags: extractHashtags(text),
    mentions: extractMentions(text)
  };
}

/**
 * Format text with clickable hashtags and mentions (for display)
 */
export function formatContent(text: string): string {
  let formatted = text;
  
  // Replace hashtags with links
  formatted = formatted.replace(
    /#([\w]+)/g,
    '<a href="/search?q=%23$1" class="text-primary hover:underline font-semibold">#$1</a>'
  );
  
  // Replace mentions with links
  formatted = formatted.replace(
    /@([\w]+)/g,
    '<a href="/profile/$1" class="text-primary hover:underline font-semibold">@$1</a>'
  );
  
  return formatted;
}

/**
 * Save hashtags to database and link to post
 */
export async function saveHashtags(postId: string, hashtags: string[]) {
  if (hashtags.length === 0) return;
  
  const supabase = createClient();
  
  for (const hashtagName of hashtags) {
    try {
      // Get or create hashtag
      let { data: hashtag, error } = await supabase
        .from("hashtags")
        .select("id")
        .eq("name", hashtagName)
        .single();
      
      if (error || !hashtag) {
        // Create new hashtag
        const { data: newHashtag } = await supabase
          .from("hashtags")
          .insert({ name: hashtagName, usage_count: 1 })
          .select("id")
          .single();
        
        hashtag = newHashtag;
      } else {
        // Increment usage count
        await supabase
          .from("hashtags")
          .update({ 
            usage_count: supabase.sql`usage_count + 1`,
            last_used: new Date().toISOString()
          })
          .eq("id", hashtag.id);
      }
      
      if (hashtag) {
        // Link hashtag to post
        await supabase
          .from("post_hashtags")
          .insert({ post_id: postId, hashtag_id: hashtag.id });
      }
    } catch (error) {
      console.error(`Error saving hashtag ${hashtagName}:`, error);
    }
  }
}

/**
 * Save mentions and create notifications
 */
export async function saveMentions(
  postId: string,
  commentId: string | null,
  mentioningUserId: string,
  mentions: string[]
) {
  if (mentions.length === 0) return;
  
  const supabase = createClient();
  
  // Get user IDs for mentioned usernames
  const { data: users } = await supabase
    .from("profiles")
    .select("id, username")
    .in("username", mentions);
  
  if (!users || users.length === 0) return;
  
  for (const user of users) {
    try {
      // Create mention record
      await supabase.from("mentions").insert({
        post_id: postId,
        comment_id: commentId,
        mentioned_user_id: user.id,
        mentioning_user_id: mentioningUserId
      });
      
      // Create notification
      await supabase.from("notifications").insert({
        user_id: user.id,
        type: "mention",
        actor_id: mentioningUserId,
        post_id: postId,
        comment_id: commentId,
        content: `mentioned you in a ${commentId ? 'comment' : 'post'}`
      });
    } catch (error) {
      console.error(`Error saving mention for @${user.username}:`, error);
    }
  }
}

/**
 * Update trending scores for hashtags (should be run periodically)
 */
export async function updateTrendingScores() {
  const supabase = createClient();
  
  // Calculate trending score based on recent usage
  // Formula: (recent_usage * 10) + (total_usage * 0.1) - (days_since_last_use * 2)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  
  const { data: hashtags } = await supabase
    .from("hashtags")
    .select("id, name, usage_count, last_used");
  
  if (!hashtags) return;
  
  for (const hashtag of hashtags) {
    // Count recent usage
    const { count: recentCount } = await supabase
      .from("post_hashtags")
      .select("*", { count: "exact", head: true })
      .eq("hashtag_id", hashtag.id)
      .gte("created_at", sevenDaysAgo);
    
    const daysSinceLastUse = hashtag.last_used
      ? Math.floor((Date.now() - new Date(hashtag.last_used).getTime()) / (1000 * 60 * 60 * 24))
      : 365;
    
    const trendingScore = 
      ((recentCount || 0) * 10) + 
      (hashtag.usage_count * 0.1) - 
      (daysSinceLastUse * 2);
    
    await supabase
      .from("hashtags")
      .update({ trending_score: Math.max(0, trendingScore) })
      .eq("id", hashtag.id);
  }
}

/**
 * Validate username format
 */
export function isValidUsername(username: string): boolean {
  return /^[a-zA-Z0-9_]{3,20}$/.test(username);
}

/**
 * Sanitize text (remove harmful content)
 */
export function sanitizeText(text: string): string {
  // Remove script tags and other potentially harmful content
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .trim();
}

/**
 * Count words in text
 */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).length;
}

/**
 * Truncate text to specified length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}
