// Mock data for development/demo purposes
export const mockUsers = [
  {
    id: "user-1",
    username: "epicgamer123",
    display_name: "Epic Gamer",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=epicgamer",
    bio: "Professional gamer | GTA V speedrunner | Content creator",
    created_at: "2024-01-01T00:00:00Z"
  },
  {
    id: "user-2", 
    username: "shadowhunter",
    display_name: "Shadow Hunter",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=shadow",
    bio: "Valorant main | Rank: Immortal | Twitch Partner",
    created_at: "2024-01-15T00:00:00Z"
  },
  {
    id: "user-3",
    username: "pixelqueen",
    display_name: "Pixel Queen",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=pixel",
    bio: "Minecraft architect | Building tutorials | 100K subs",
    created_at: "2024-02-01T00:00:00Z"
  },
  {
    id: "user-4",
    username: "fortnitepro",
    display_name: "Fortnite Pro",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=fortnite",
    bio: "Victory Royale specialist | Daily streams",
    created_at: "2024-02-15T00:00:00Z"
  }
];

export const mockGames = [
  { id: 1, name: "Grand Theft Auto V", slug: "gta-v", cover_url: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400" },
  { id: 2, name: "Valorant", slug: "valorant", cover_url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400" },
  { id: 3, name: "Fortnite", slug: "fortnite", cover_url: "https://images.unsplash.com/photo-1589241062272-c0a000072dfa?w=400" },
  { id: 4, name: "Minecraft", slug: "minecraft", cover_url: "https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=400" },
  { id: 5, name: "Apex Legends", slug: "apex-legends", cover_url: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400" },
  { id: 6, name: "Call of Duty", slug: "cod", cover_url: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400" },
  { id: 7, name: "League of Legends", slug: "lol", cover_url: "https://images.unsplash.com/photo-1598121496628-9a8f2e3e7c9f?w=400" },
  { id: 8, name: "CS:GO 2", slug: "csgo2", cover_url: "https://images.unsplash.com/photo-1560419015-7c427e8ae5ba?w=400" }
];

export const mockPosts = [
  {
    id: 1,
    author: mockUsers[0],
    game: mockGames[0],
    caption: "Just pulled off the most insane heist in GTA V! The adrenaline rush is real 🔥 Check out this epic escape!",
    thumbnail: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800",
    hasVideo: true,
    hasImage: false,
    like_count: 342,
    comment_count: 28,
    repost_count: 15,
    isLiked: false,
    created_at: new Date().toISOString(),
    engagement_score: 400
  },
  {
    id: 2,
    author: mockUsers[1],
    game: mockGames[1],
    caption: "ACE! 🎯 Clutched a 1v5 in Valorant ranked. My heart is still racing!",
    thumbnail: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800",
    hasVideo: true,
    hasImage: false,
    like_count: 567,
    comment_count: 45,
    repost_count: 23,
    isLiked: true,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    engagement_score: 650
  },
  {
    id: 3,
    author: mockUsers[2],
    game: mockGames[3],
    caption: "Finished my medieval castle build! 200+ hours of work. What do you think? 🏰",
    thumbnail: "https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=800",
    hasVideo: false,
    hasImage: true,
    like_count: 892,
    comment_count: 67,
    repost_count: 45,
    isLiked: false,
    created_at: new Date(Date.now() - 7200000).toISOString(),
    engagement_score: 1000
  },
  {
    id: 4,
    author: mockUsers[3],
    game: mockGames[2],
    caption: "Victory Royale with 23 eliminations! New personal record 🏆",
    thumbnail: "https://images.unsplash.com/photo-1589241062272-c0a000072dfa?w=800",
    hasVideo: true,
    hasImage: false,
    like_count: 234,
    comment_count: 19,
    repost_count: 8,
    isLiked: false,
    created_at: new Date(Date.now() - 10800000).toISOString(),
    engagement_score: 280
  },
  {
    id: 5,
    author: mockUsers[0],
    game: mockGames[4],
    caption: "That final ring clutch though! Apex Legends never gets old 💪",
    thumbnail: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800",
    hasVideo: true,
    hasImage: false,
    like_count: 445,
    comment_count: 32,
    repost_count: 18,
    isLiked: true,
    created_at: new Date(Date.now() - 14400000).toISOString(),
    engagement_score: 520
  },
  {
    id: 6,
    author: mockUsers[1],
    game: mockGames[5],
    caption: "No scope across the map! I can't believe that actually hit 😱",
    thumbnail: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800",
    hasVideo: true,
    hasImage: false,
    like_count: 678,
    comment_count: 54,
    repost_count: 31,
    isLiked: false,
    created_at: new Date(Date.now() - 18000000).toISOString(),
    engagement_score: 800
  }
];

export const mockComments = [
  {
    id: 1,
    post_id: 1,
    author: mockUsers[1],
    body: "That was insane! How did you even pull that off?",
    created_at: new Date(Date.now() - 1800000).toISOString()
  },
  {
    id: 2,
    post_id: 1,
    author: mockUsers[2],
    body: "GTA V at its finest! 🔥",
    created_at: new Date(Date.now() - 900000).toISOString()
  },
  {
    id: 3,
    post_id: 2,
    author: mockUsers[0],
    body: "Teach me your ways! I'm stuck in Gold 😭",
    created_at: new Date(Date.now() - 600000).toISOString()
  }
];

export const mockNotifications = [
  {
    id: 1,
    type: "like",
    actor: mockUsers[1],
    post: mockPosts[0],
    created_at: new Date(Date.now() - 300000).toISOString(),
    read: false
  },
  {
    id: 2,
    type: "comment",
    actor: mockUsers[2],
    post: mockPosts[0],
    comment: mockComments[1],
    created_at: new Date(Date.now() - 600000).toISOString(),
    read: false
  },
  {
    id: 3,
    type: "follow",
    actor: mockUsers[3],
    created_at: new Date(Date.now() - 900000).toISOString(),
    read: true
  }
];

export const mockMessages = [
  {
    id: 1,
    conversation_id: 1,
    sender: mockUsers[1],
    body: "Hey! Want to squad up for some Valorant?",
    created_at: new Date(Date.now() - 1800000).toISOString()
  },
  {
    id: 2,
    conversation_id: 1,
    sender: mockUsers[0],
    body: "Sure! Let me finish this match first",
    created_at: new Date(Date.now() - 1500000).toISOString()
  }
];

export const mockServers = [
  {
    id: 1,
    name: "GTA V Speedrunners",
    description: "Community for GTA V speedrun enthusiasts",
    icon_url: "https://api.dicebear.com/7.x/identicon/svg?seed=gta",
    member_count: 1234,
    online_count: 89,
    game: mockGames[0]
  },
  {
    id: 2,
    name: "Valorant Pros",
    description: "High-rank Valorant players only",
    icon_url: "https://api.dicebear.com/7.x/identicon/svg?seed=val",
    member_count: 567,
    online_count: 45,
    game: mockGames[1]
  },
  {
    id: 3,
    name: "Minecraft Builders",
    description: "Share your builds and get inspiration",
    icon_url: "https://api.dicebear.com/7.x/identicon/svg?seed=mc",
    member_count: 2345,
    online_count: 234,
    game: mockGames[3]
  }
];
