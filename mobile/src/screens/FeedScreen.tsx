import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

interface Post {
  id: string;
  caption: string;
  author: {
    display_name: string;
    username: string;
    avatar_url: string;
  };
  game?: {
    name: string;
  };
  thumbnail_url?: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  is_liked: boolean;
}

export default function FeedScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    postCard: {
      backgroundColor: colors.surface,
      marginBottom: 12,
      padding: 16,
    },
    postHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 12,
      backgroundColor: colors.border,
    },
    userInfo: {
      flex: 1,
    },
    username: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    gameInfo: {
      fontSize: 14,
      color: colors.textSecondary,
      flexDirection: 'row',
      alignItems: 'center',
    },
    caption: {
      fontSize: 15,
      color: colors.text,
      lineHeight: 20,
      marginBottom: 12,
    },
    mediaContainer: {
      aspectRatio: 16 / 9,
      backgroundColor: colors.border,
      borderRadius: 8,
      marginBottom: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    media: {
      width: '100%',
      height: '100%',
      borderRadius: 8,
    },
    placeholderIcon: {
      opacity: 0.3,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    leftActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 20,
      padding: 8,
    },
    actionText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginLeft: 6,
    },
    likedText: {
      color: '#ef4444',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginTop: 16,
      textAlign: 'center',
    },
    emptySubtext: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 8,
      textAlign: 'center',
      lineHeight: 20,
    },
  });

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async () => {
    setLoading(true);
    try {
      // Simulate API call with mock data
      setTimeout(() => {
        const mockPosts: Post[] = [
          {
            id: '1',
            caption: 'Just got an amazing clutch in Valorant! The timing was perfect 🔥',
            author: {
              display_name: 'ProGamer123',
              username: 'progamer123',
              avatar_url: '',
            },
            game: {
              name: 'Valorant',
            },
            likes_count: 24,
            comments_count: 8,
            created_at: new Date().toISOString(),
            is_liked: false,
          },
          {
            id: '2',
            caption: 'Finally reached Diamond rank after months of grinding! The journey was tough but totally worth it 💎',
            author: {
              display_name: 'DiamondPlayer',
              username: 'diamondplayer',
              avatar_url: '',
            },
            game: {
              name: 'League of Legends',
            },
            likes_count: 56,
            comments_count: 12,
            created_at: new Date(Date.now() - 3600000).toISOString(),
            is_liked: true,
          },
          {
            id: '3',
            caption: 'Check out this insane build I created in Minecraft! Took me 3 weeks to complete 🏰',
            author: {
              display_name: 'BlockMaster',
              username: 'blockmaster',
              avatar_url: '',
            },
            game: {
              name: 'Minecraft',
            },
            likes_count: 89,
            comments_count: 23,
            created_at: new Date(Date.now() - 7200000).toISOString(),
            is_liked: false,
          },
        ];
        setPosts(mockPosts);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading feed:', error);
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFeed();
    setRefreshing(false);
  };

  const handleLike = (postId: string) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          is_liked: !post.is_liked,
          likes_count: post.is_liked ? post.likes_count - 1 : post.likes_count + 1,
        };
      }
      return post;
    }));
  };

  const renderPost = ({ item: post }: { item: Post }) => (
    <View style={styles.postCard}>
      {/* Header */}
      <View style={styles.postHeader}>
        <Image 
          source={{ uri: post.author.avatar_url || undefined }}
          style={styles.avatar}
        />
        <View style={styles.userInfo}>
          <Text style={styles.username}>
            {post.author.display_name || post.author.username}
          </Text>
          <View style={styles.gameInfo}>
            {post.game && (
              <>
                <Ionicons name="game-controller" size={12} color={colors.textSecondary} />
                <Text style={[styles.gameInfo, { marginLeft: 4 }]}>
                  {post.game.name}
                </Text>
              </>
            )}
          </View>
        </View>
        <TouchableOpacity>
          <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Caption */}
      <Text style={styles.caption}>{post.caption}</Text>

      {/* Media */}
      <View style={styles.mediaContainer}>
        {post.thumbnail_url ? (
          <Image source={{ uri: post.thumbnail_url }} style={styles.media} />
        ) : (
          <Ionicons 
            name="image-outline" 
            size={48} 
            color={colors.textSecondary}
            style={styles.placeholderIcon}
          />
        )}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <View style={styles.leftActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleLike(post.id)}
          >
            <Ionicons 
              name={post.is_liked ? "heart" : "heart-outline"} 
              size={22} 
              color={post.is_liked ? "#ef4444" : colors.textSecondary}
            />
            <Text style={[
              styles.actionText, 
              post.is_liked && styles.likedText
            ]}>
              {post.likes_count}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={22} color={colors.textSecondary} />
            <Text style={styles.actionText}>{post.comments_count}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="share-outline" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="bookmark-outline" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (posts.length === 0 && !loading) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="newspaper-outline" size={64} color={colors.textSecondary} />
        <Text style={styles.emptyText}>No posts yet</Text>
        <Text style={styles.emptySubtext}>
          Follow some gamers or start sharing your own epic moments to see them here!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      />
    </View>
  );
}
