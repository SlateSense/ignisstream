export const mockUsers = [
  {
    id: "u1",
    username: "forge_player",
    display_name: "Forge Player",
    avatar_url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=128&q=80"
  },
  {
    id: "u2",
    username: "pro_clutcher",
    display_name: "Pro Clutcher",
    avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=128&q=80"
  }
];

export const mockGames = [
  {
    id: 1,
    name: "Valorant",
    slug: "valorant",
    cover_url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&q=80"
  },
  {
    id: 2,
    name: "Counter-Strike 2",
    slug: "counter-strike-2",
    cover_url: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&q=80"
  },
  {
    id: 3,
    name: "Fortnite",
    slug: "fortnite",
    cover_url: "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=1200&q=80"
  }
];

export const mockPosts = [
  {
    id: 1,
    caption: "Clutched a 1v4 in ranked. Still shaking.",
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    thumbnail: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&q=80",
    hasVideo: true,
    like_count: 42,
    comment_count: 6,
    repost_count: 2,
    engagement_score: "9.2%",
    isLiked: false,
    author: mockUsers[1],
    game: mockGames[0]
  },
  {
    id: 2,
    caption: "Road to global elite starts now.",
    created_at: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
    thumbnail: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&q=80",
    hasVideo: false,
    like_count: 18,
    comment_count: 2,
    repost_count: 1,
    engagement_score: "4.8%",
    isLiked: true,
    author: mockUsers[0],
    game: mockGames[1]
  }
];

export const mockComments = [
  {
    id: 1,
    post_id: 1,
    body: "That crosshair placement was crazy.",
    created_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    author: mockUsers[0]
  },
  {
    id: 2,
    post_id: 1,
    body: "Upload the full VOD please!",
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    author: mockUsers[1]
  },
  {
    id: 3,
    post_id: 2,
    body: "GLHF 🔥",
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    author: mockUsers[1]
  }
];
