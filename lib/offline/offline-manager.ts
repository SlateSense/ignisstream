/**
 * Advanced Offline Manager for IgnisStream
 * Comprehensive offline functionality with intelligent caching and sync
 */

import { createClient } from '@supabase/supabase-js';

interface CachedPost {
  id: string;
  user_id: string;
  title: string;
  content: string;
  image_url?: string;
  video_url?: string;
  game_title?: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  author: {
    display_name: string;
    avatar_url: string;
  };
  is_liked: boolean;
  cached_at: number;
  offline_actions?: OfflineAction[];
}

interface OfflineAction {
  id: string;
  type: 'like' | 'unlike' | 'comment' | 'share' | 'bookmark' | 'post_create' | 'post_edit' | 'post_delete';
  target_id: string;
  data: any;
  timestamp: number;
  status: 'pending' | 'syncing' | 'completed' | 'failed';
  retry_count: number;
  user_id: string;
}

interface CachedUser {
  id: string;
  display_name: string;
  avatar_url: string;
  bio?: string;
  gaming_preferences?: any;
  cached_at: number;
}

interface CachedGame {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  genre: string;
  rating: number;
  cached_at: number;
}

interface OfflineCapabilities {
  canViewPosts: boolean;
  canLikePosts: boolean;
  canComment: boolean;
  canCreatePosts: boolean;
  canEditProfile: boolean;
  canViewGames: boolean;
  cacheSize: number;
  lastSync: number;
}

export class OfflineManager {
  private db: IDBDatabase | null = null;
  private supabase: any;
  private isOnline = navigator.onLine;
  private syncInProgress = false;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    this.setupOnlineHandlers();
  }

  // Initialize offline system
  async initialize(): Promise<boolean> {
    try {
      await this.initializeDB();
      await this.setupPeriodicSync();
      
      // Initial cache population if online
      if (this.isOnline) {
        await this.populateInitialCache();
      }

      this.emit('initialized', await this.getCapabilities());
      return true;
    } catch (error) {
      console.error('Failed to initialize offline manager:', error);
      return false;
    }
  }

  private async initializeDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('IgnisStreamOfflineDB', 2);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Posts store
        if (!db.objectStoreNames.contains('posts')) {
          const postsStore = db.createObjectStore('posts', { keyPath: 'id' });
          postsStore.createIndex('game_title', 'game_title', { unique: false });
          postsStore.createIndex('user_id', 'user_id', { unique: false });
          postsStore.createIndex('cached_at', 'cached_at', { unique: false });
        }
        
        // Offline actions store
        if (!db.objectStoreNames.contains('offline_actions')) {
          const actionsStore = db.createObjectStore('offline_actions', { keyPath: 'id' });
          actionsStore.createIndex('type', 'type', { unique: false });
          actionsStore.createIndex('status', 'status', { unique: false });
          actionsStore.createIndex('timestamp', 'timestamp', { unique: false });
          actionsStore.createIndex('user_id', 'user_id', { unique: false });
        }
        
        // Users store
        if (!db.objectStoreNames.contains('users')) {
          const usersStore = db.createObjectStore('users', { keyPath: 'id' });
          usersStore.createIndex('display_name', 'display_name', { unique: false });
          usersStore.createIndex('cached_at', 'cached_at', { unique: false });
        }
        
        // Games store
        if (!db.objectStoreNames.contains('games')) {
          const gamesStore = db.createObjectStore('games', { keyPath: 'id' });
          gamesStore.createIndex('title', 'title', { unique: false });
          gamesStore.createIndex('genre', 'genre', { unique: false });
          gamesStore.createIndex('cached_at', 'cached_at', { unique: false });
        }

        // Comments store
        if (!db.objectStoreNames.contains('comments')) {
          const commentsStore = db.createObjectStore('comments', { keyPath: 'id' });
          commentsStore.createIndex('post_id', 'post_id', { unique: false });
          commentsStore.createIndex('user_id', 'user_id', { unique: false });
          commentsStore.createIndex('cached_at', 'cached_at', { unique: false });
        }

        // Media store for images/videos
        if (!db.objectStoreNames.contains('media')) {
          const mediaStore = db.createObjectStore('media', { keyPath: 'url' });
          mediaStore.createIndex('type', 'type', { unique: false });
          mediaStore.createIndex('cached_at', 'cached_at', { unique: false });
        }
      };
    });
  }

  // Post Management
  async getCachedPosts(limit = 20, offset = 0, gameTitle?: string): Promise<CachedPost[]> {
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['posts'], 'readonly');
      const store = transaction.objectStore('posts');
      
      let request: IDBRequest;
      if (gameTitle) {
        const index = store.index('game_title');
        request = index.getAll(gameTitle);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => {
        const posts = request.result
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(offset, offset + limit);
        resolve(posts);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async cachePost(post: any): Promise<void> {
    if (!this.db) return;

    const cachedPost: CachedPost = {
      id: post.id,
      user_id: post.user_id,
      title: post.title,
      content: post.content,
      image_url: post.image_url,
      video_url: post.video_url,
      game_title: post.game_title,
      likes_count: post.likes_count || 0,
      comments_count: post.comments_count || 0,
      created_at: post.created_at,
      author: {
        display_name: post.profiles?.display_name || 'Unknown',
        avatar_url: post.profiles?.avatar_url || '',
      },
      is_liked: post.is_liked || false,
      cached_at: Date.now(),
    };

    const transaction = this.db.transaction(['posts'], 'readwrite');
    const store = transaction.objectStore('posts');
    
    return new Promise((resolve, reject) => {
      const request = store.put(cachedPost);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async cachePosts(posts: any[]): Promise<void> {
    const promises = posts.map(post => this.cachePost(post));
    await Promise.all(promises);
    
    // Also cache media URLs
    await this.cachePostMedia(posts);
  }

  private async cachePostMedia(posts: any[]): Promise<void> {
    if (!this.db) return;

    const mediaUrls: string[] = [];
    
    posts.forEach(post => {
      if (post.image_url) mediaUrls.push(post.image_url);
      if (post.video_url) mediaUrls.push(post.video_url);
      if (post.profiles?.avatar_url) mediaUrls.push(post.profiles.avatar_url);
    });

    // Cache media files
    for (const url of mediaUrls) {
      try {
        await this.cacheMediaFile(url);
      } catch (error) {
        console.warn(`Failed to cache media: ${url}`, error);
      }
    }
  }

  private async cacheMediaFile(url: string): Promise<void> {
    if (!this.db) return;

    try {
      const response = await fetch(url);
      const blob = await response.blob();
      
      const mediaData = {
        url,
        data: blob,
        type: blob.type,
        size: blob.size,
        cached_at: Date.now(),
      };

      const transaction = this.db.transaction(['media'], 'readwrite');
      const store = transaction.objectStore('media');
      
      return new Promise((resolve, reject) => {
        const request = store.put(mediaData);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`Failed to cache media file ${url}:`, error);
    }
  }

  async getCachedMediaFile(url: string): Promise<string | null> {
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['media'], 'readonly');
      const store = transaction.objectStore('media');
      const request = store.get(url);

      request.onsuccess = () => {
        if (request.result) {
          const objectUrl = URL.createObjectURL(request.result.data);
          resolve(objectUrl);
        } else {
          resolve(null);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  // Offline Actions Management
  async queueOfflineAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'status' | 'retry_count'>): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const offlineAction: OfflineAction = {
      ...action,
      id: this.generateId(),
      timestamp: Date.now(),
      status: 'pending',
      retry_count: 0,
    };

    const transaction = this.db.transaction(['offline_actions'], 'readwrite');
    const store = transaction.objectStore('offline_actions');
    
    return new Promise((resolve, reject) => {
      const request = store.add(offlineAction);
      request.onsuccess = () => {
        this.emit('actionQueued', offlineAction);
        resolve(offlineAction.id);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async likePost(postId: string, userId: string): Promise<void> {
    // Update local cache immediately for optimistic UI
    await this.updateLocalPostLike(postId, true);
    
    // Queue action for sync
    if (!this.isOnline) {
      await this.queueOfflineAction({
        type: 'like',
        target_id: postId,
        data: { post_id: postId },
        user_id: userId,
      });
    } else {
      try {
        await this.supabase
          .from('likes')
          .insert({ post_id: postId, user_id: userId });
      } catch (error) {
        // If online request fails, queue for later
        await this.queueOfflineAction({
          type: 'like',
          target_id: postId,
          data: { post_id: postId },
          user_id: userId,
        });
      }
    }
  }

  async unlikePost(postId: string, userId: string): Promise<void> {
    // Update local cache immediately
    await this.updateLocalPostLike(postId, false);
    
    // Queue action for sync
    if (!this.isOnline) {
      await this.queueOfflineAction({
        type: 'unlike',
        target_id: postId,
        data: { post_id: postId },
        user_id: userId,
      });
    } else {
      try {
        await this.supabase
          .from('likes')
          .delete()
          .match({ post_id: postId, user_id: userId });
      } catch (error) {
        await this.queueOfflineAction({
          type: 'unlike',
          target_id: postId,
          data: { post_id: postId },
          user_id: userId,
        });
      }
    }
  }

  private async updateLocalPostLike(postId: string, isLiked: boolean): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(['posts'], 'readwrite');
    const store = transaction.objectStore('posts');
    
    return new Promise((resolve, reject) => {
      const getRequest = store.get(postId);
      
      getRequest.onsuccess = () => {
        const post = getRequest.result;
        if (post) {
          post.is_liked = isLiked;
          post.likes_count += isLiked ? 1 : -1;
          
          const putRequest = store.put(post);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve();
        }
      };
      
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async createOfflinePost(postData: {
    title: string;
    content: string;
    gameTitle?: string;
    imageFile?: File;
    videoFile?: File;
    userId: string;
  }): Promise<string> {
    const tempId = `temp_${this.generateId()}`;
    
    // Create temporary post for immediate display
    const tempPost: CachedPost = {
      id: tempId,
      user_id: postData.userId,
      title: postData.title,
      content: postData.content,
      game_title: postData.gameTitle,
      likes_count: 0,
      comments_count: 0,
      created_at: new Date().toISOString(),
      author: {
        display_name: 'You', // Will be updated when synced
        avatar_url: '',
      },
      is_liked: false,
      cached_at: Date.now(),
    };

    // Cache the post locally
    await this.cachePost(tempPost);

    // Queue for creation when online
    await this.queueOfflineAction({
      type: 'post_create',
      target_id: tempId,
      data: {
        title: postData.title,
        content: postData.content,
        game_title: postData.gameTitle,
        image_file: postData.imageFile,
        video_file: postData.videoFile,
      },
      user_id: postData.userId,
    });

    return tempId;
  }

  // Sync Management
  async syncOfflineActions(): Promise<void> {
    if (this.syncInProgress || !this.isOnline || !this.db) return;
    
    this.syncInProgress = true;
    this.emit('syncStarted');

    try {
      const actions = await this.getPendingActions();
      
      for (const action of actions) {
        try {
          await this.executeAction(action);
          await this.markActionCompleted(action.id);
        } catch (error) {
          console.error(`Failed to sync action ${action.id}:`, error);
          await this.markActionFailed(action.id);
        }
      }

      // Refresh cached data
      await this.refreshCache();
      
      this.emit('syncCompleted', { synced: actions.length });
    } catch (error) {
      console.error('Sync failed:', error);
      this.emit('syncFailed', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  private async getPendingActions(): Promise<OfflineAction[]> {
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offline_actions'], 'readonly');
      const store = transaction.objectStore('offline_actions');
      const index = store.index('status');
      const request = index.getAll('pending');

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async executeAction(action: OfflineAction): Promise<void> {
    switch (action.type) {
      case 'like':
        await this.supabase
          .from('likes')
          .insert({ post_id: action.data.post_id, user_id: action.user_id });
        break;
        
      case 'unlike':
        await this.supabase
          .from('likes')
          .delete()
          .match({ post_id: action.data.post_id, user_id: action.user_id });
        break;
        
      case 'comment':
        await this.supabase
          .from('comments')
          .insert({
            post_id: action.data.post_id,
            user_id: action.user_id,
            content: action.data.content,
          });
        break;
        
      case 'post_create':
        const { data: newPost } = await this.supabase
          .from('posts')
          .insert({
            user_id: action.user_id,
            title: action.data.title,
            content: action.data.content,
            game_title: action.data.game_title,
          })
          .select()
          .single();
          
        // Update the temporary post with real ID
        if (newPost) {
          await this.updateTempPostId(action.target_id, newPost.id);
        }
        break;
        
      default:
        console.warn(`Unknown action type: ${action.type}`);
    }
  }

  private async markActionCompleted(actionId: string): Promise<void> {
    await this.updateActionStatus(actionId, 'completed');
  }

  private async markActionFailed(actionId: string): Promise<void> {
    await this.updateActionStatus(actionId, 'failed');
  }

  private async updateActionStatus(actionId: string, status: OfflineAction['status']): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(['offline_actions'], 'readwrite');
    const store = transaction.objectStore('offline_actions');
    
    return new Promise((resolve, reject) => {
      const getRequest = store.get(actionId);
      
      getRequest.onsuccess = () => {
        const action = getRequest.result;
        if (action) {
          action.status = status;
          action.retry_count += 1;
          
          const putRequest = store.put(action);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve();
        }
      };
      
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  private async updateTempPostId(tempId: string, realId: string): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(['posts'], 'readwrite');
    const store = transaction.objectStore('posts');
    
    return new Promise((resolve, reject) => {
      const getRequest = store.get(tempId);
      
      getRequest.onsuccess = () => {
        const post = getRequest.result;
        if (post) {
          // Delete old temp post
          const deleteRequest = store.delete(tempId);
          deleteRequest.onsuccess = () => {
            // Insert with new ID
            post.id = realId;
            const putRequest = store.put(post);
            putRequest.onsuccess = () => resolve();
            putRequest.onerror = () => reject(putRequest.error);
          };
        } else {
          resolve();
        }
      };
      
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // Cache Management
  private async populateInitialCache(): Promise<void> {
    try {
      // Cache recent posts
      const { data: posts } = await this.supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id(display_name, avatar_url),
          likes!inner(user_id)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (posts) {
        await this.cachePosts(posts);
      }

      // Cache popular games
      const { data: games } = await this.supabase
        .from('games')
        .select('*')
        .eq('active', true)
        .order('player_count', { ascending: false })
        .limit(20);

      if (games) {
        await this.cacheGames(games);
      }

    } catch (error) {
      console.error('Failed to populate initial cache:', error);
    }
  }

  private async refreshCache(): Promise<void> {
    if (!this.isOnline) return;

    // Refresh posts that are older than 1 hour
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const oldPosts = await this.getOldCachedPosts(oneHourAgo);
    
    for (const post of oldPosts) {
      try {
        const { data: freshPost } = await this.supabase
          .from('posts')
          .select(`
            *,
            profiles:user_id(display_name, avatar_url)
          `)
          .eq('id', post.id)
          .single();

        if (freshPost) {
          await this.cachePost(freshPost);
        }
      } catch (error) {
        console.warn(`Failed to refresh post ${post.id}:`, error);
      }
    }
  }

  private async getOldCachedPosts(beforeTimestamp: number): Promise<CachedPost[]> {
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['posts'], 'readonly');
      const store = transaction.objectStore('posts');
      const index = store.index('cached_at');
      const range = IDBKeyRange.upperBound(beforeTimestamp);
      const request = index.getAll(range);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async cacheGames(games: any[]): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(['games'], 'readwrite');
    const store = transaction.objectStore('games');

    for (const game of games) {
      const cachedGame: CachedGame = {
        id: game.id,
        title: game.title,
        description: game.description,
        image_url: game.image_url,
        genre: game.genre,
        rating: game.rating,
        cached_at: Date.now(),
      };

      await new Promise<void>((resolve, reject) => {
        const request = store.put(cachedGame);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  }

  // Capabilities and Status
  async getCapabilities(): Promise<OfflineCapabilities> {
    const cacheSize = await this.getCacheSize();
    const lastSync = await this.getLastSyncTime();

    return {
      canViewPosts: true,
      canLikePosts: true,
      canComment: true,
      canCreatePosts: true,
      canEditProfile: false, // Requires online for security
      canViewGames: true,
      cacheSize,
      lastSync,
    };
  }

  private async getCacheSize(): Promise<number> {
    if (!this.db) return 0;

    let totalSize = 0;
    const storeNames = ['posts', 'offline_actions', 'users', 'games', 'comments', 'media'];

    for (const storeName of storeNames) {
      const count = await new Promise<number>((resolve, reject) => {
        const transaction = this.db!.transaction([storeName], 'readonly');
        const store = transaction.objectStore('posts');
        const request = store.count();
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      
      totalSize += count;
    }

    return totalSize;
  }

  private async getLastSyncTime(): Promise<number> {
    return parseInt(localStorage.getItem('ignisstream_last_sync') || '0');
  }

  private setLastSyncTime(): void {
    localStorage.setItem('ignisstream_last_sync', Date.now().toString());
  }

  // Online/Offline Handlers
  private setupOnlineHandlers(): void {
    const handleOnline = () => {
      this.isOnline = true;
      this.emit('online');
      this.syncOfflineActions();
    };

    const handleOffline = () => {
      this.isOnline = false;
      this.emit('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
  }

  private setupPeriodicSync(): void {
    // Sync every 5 minutes when online
    setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.syncOfflineActions();
      }
    }, 5 * 60 * 1000);
  }

  // Cleanup
  async clearCache(): Promise<void> {
    if (!this.db) return;

    const storeNames = ['posts', 'offline_actions', 'users', 'games', 'comments', 'media'];
    
    for (const storeName of storeNames) {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }

    this.emit('cacheCleared');
  }

  // Event System
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Initialize global offline manager
export const offlineManager = new OfflineManager();
