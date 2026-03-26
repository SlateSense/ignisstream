/**
 * IgnisStream Service Worker
 * Advanced PWA functionality with gaming-optimized features
 */

const CACHE_NAME = 'ignisstream-v2';
const STATIC_CACHE = 'ignisstream-static-v2';
const DYNAMIC_CACHE = 'ignisstream-dynamic-v2';
const IMAGE_CACHE = 'ignisstream-images-v2';
const API_CACHE = 'ignisstream-api-v2';
const DISABLE_SERVICE_WORKER =
  self.location.hostname === 'localhost' ||
  self.location.hostname === '127.0.0.1' ||
  self.location.hostname === '0.0.0.0';

// Cache strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only'
};

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/offline',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Gaming-specific assets to cache
const GAMING_ASSETS = [
  '/images/game-icons/',
  '/images/achievements/',
  '/sounds/notification.mp3',
  '/sounds/achievement.mp3',
];

// API endpoints cache configuration
const API_CACHE_CONFIG = {
  '/api/games': { strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE, ttl: 3600000 }, // 1 hour
  '/api/user/profile': { strategy: CACHE_STRATEGIES.NETWORK_FIRST, ttl: 300000 }, // 5 minutes
  '/api/posts': { strategy: CACHE_STRATEGIES.NETWORK_FIRST, ttl: 60000 }, // 1 minute
  '/api/notifications': { strategy: CACHE_STRATEGIES.NETWORK_FIRST, ttl: 30000 }, // 30 seconds
  '/api/achievements': { strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE, ttl: 1800000 }, // 30 minutes
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('IgnisStream SW: Installing...');

  if (DISABLE_SERVICE_WORKER) {
    event.waitUntil(self.skipWaiting());
    return;
  }
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      }),
      
      // Cache gaming assets
      caches.open(IMAGE_CACHE).then((cache) => {
        return cache.addAll(GAMING_ASSETS);
      }),
      
      // Initialize background sync
      typeof self.registration.sync?.register === 'function'
        ? self.registration.sync.register('background-sync').catch(() => undefined)
        : Promise.resolve(),
    ])
  );
  
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('IgnisStream SW: Activating...');

  if (DISABLE_SERVICE_WORKER) {
    event.waitUntil(
      caches.keys().then((cacheNames) =>
        Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)))
      ).then(() => self.registration.unregister())
    );
    return;
  }
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName.startsWith('ignisstream-') && 
                     ![CACHE_NAME, STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE, API_CACHE].includes(cacheName);
            })
            .map((cacheName) => caches.delete(cacheName))
        );
      }),
      
      // Claim all clients
      self.clients.claim(),
    ])
  );
});

// Fetch event - handle all requests with intelligent caching
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (DISABLE_SERVICE_WORKER || isNextBuildAsset(url)) {
    return;
  }
  
  // Skip non-GET requests and external URLs
  if (request.method !== 'GET' || !url.origin.includes(self.location.origin)) {
    return;
  }
  
  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleAPIRequest(request));
  } else if (isImageRequest(request)) {
    event.respondWith(handleImageRequest(request));
  } else if (isStaticAsset(request)) {
    event.respondWith(handleStaticRequest(request));
  } else {
    event.respondWith(handlePageRequest(request));
  }
});

// API request handler with intelligent caching
async function handleAPIRequest(request) {
  const url = new URL(request.url);
  const endpoint = url.pathname;
  
  // Find matching cache configuration
  let cacheConfig = null;
  for (const [pattern, config] of Object.entries(API_CACHE_CONFIG)) {
    if (endpoint.startsWith(pattern)) {
      cacheConfig = config;
      break;
    }
  }
  
  // Default to network-first for unknown APIs
  if (!cacheConfig) {
    cacheConfig = { strategy: CACHE_STRATEGIES.NETWORK_FIRST, ttl: 60000 };
  }
  
  const cache = await caches.open(API_CACHE);
  
  switch (cacheConfig.strategy) {
    case CACHE_STRATEGIES.CACHE_FIRST:
      return cacheFirst(request, cache, cacheConfig.ttl);
      
    case CACHE_STRATEGIES.NETWORK_FIRST:
      return networkFirst(request, cache, cacheConfig.ttl);
      
    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      return staleWhileRevalidate(request, cache, cacheConfig.ttl);
      
    default:
      return networkFirst(request, cache, cacheConfig.ttl);
  }
}

// Image request handler with gaming optimizations
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE);
  
  // Check cache first for images
  const cachedResponse = await cache.match(request);
  if (cachedResponse && !isExpired(cachedResponse, 86400000)) { // 24 hours
    return cachedResponse;
  }
  
  try {
    // Try to fetch from network
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Clone and cache the response
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    // If network fails, return cached version if available
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return placeholder image if nothing available
    return createPlaceholderImageResponse();
  } catch (error) {
    console.error('Image fetch failed:', error);
    return cachedResponse || createPlaceholderImageResponse();
  }
}

// Static asset handler
async function handleStaticRequest(request) {
  const url = new URL(request.url);
  if (isNextBuildAsset(url)) {
    return fetch(request);
  }

  const cache = await caches.open(STATIC_CACHE);
  return cacheFirst(request, cache, 86400000); // 24 hours
}

// Page request handler with offline fallback
async function handlePageRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  
  try {
    // Try network first for pages
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    // If network fails, try cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page as fallback
    return cache.match('/offline') || new Response('Offline', { status: 503 });
  } catch (error) {
    console.error('Page fetch failed:', error);
    
    // Try cache first when network is completely down
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page
    return cache.match('/offline') || new Response('Offline', { status: 503 });
  }
}

// Cache strategy implementations
async function cacheFirst(request, cache, ttl) {
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse && !isExpired(cachedResponse, ttl)) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return cachedResponse || new Response('Network Error', { status: 503 });
  }
}

async function networkFirst(request, cache, ttl) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    // If network response is not ok, try cache
    const cachedResponse = await cache.match(request);
    return cachedResponse || networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    return cachedResponse || new Response('Network Error', { status: 503 });
  }
}

async function staleWhileRevalidate(request, cache, ttl) {
  const cachedResponse = await cache.match(request);
  
  // Always try to update cache in background
  const networkResponsePromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  });
  
  // Return cached response if available, otherwise wait for network
  if (cachedResponse && !isExpired(cachedResponse, ttl)) {
    // Update cache in background
    networkResponsePromise.catch(() => {}); // Ignore errors for background update
    return cachedResponse;
  }
  
  return networkResponsePromise.catch(() => {
    return cachedResponse || new Response('Network Error', { status: 503 });
  });
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      Promise.all([
        syncOfflinePosts(),
        syncOfflineReactions(),
        syncOfflineMessages(),
        syncGameStats(),
      ])
    );
  }
});

// Sync offline posts when connection is restored
async function syncOfflinePosts() {
  try {
    const offlinePosts = await getFromIndexedDB('offline_posts');
    
    for (const post of offlinePosts) {
      try {
        const response = await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(post.data),
        });
        
        if (response.ok) {
          await removeFromIndexedDB('offline_posts', post.id);
          
          // Notify user of successful sync
          self.registration.showNotification('Post Synced!', {
            body: 'Your offline post has been published.',
            icon: '/icons/icon-192x192.png',
            badge: '/icons/badge.png',
            tag: 'post-sync',
          });
        }
      } catch (error) {
        console.error('Failed to sync post:', error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Sync offline reactions (likes, comments)
async function syncOfflineReactions() {
  try {
    const offlineReactions = await getFromIndexedDB('offline_reactions');
    
    for (const reaction of offlineReactions) {
      try {
        const response = await fetch(reaction.endpoint, {
          method: reaction.method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reaction.data),
        });
        
        if (response.ok) {
          await removeFromIndexedDB('offline_reactions', reaction.id);
        }
      } catch (error) {
        console.error('Failed to sync reaction:', error);
      }
    }
  } catch (error) {
    console.error('Reaction sync failed:', error);
  }
}

// Sync offline messages
async function syncOfflineMessages() {
  try {
    const offlineMessages = await getFromIndexedDB('offline_messages');
    
    for (const message of offlineMessages) {
      try {
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message.data),
        });
        
        if (response.ok) {
          await removeFromIndexedDB('offline_messages', message.id);
        }
      } catch (error) {
        console.error('Failed to sync message:', error);
      }
    }
  } catch (error) {
    console.error('Message sync failed:', error);
  }
}

// Sync gaming statistics
async function syncGameStats() {
  try {
    const offlineStats = await getFromIndexedDB('offline_game_stats');
    
    for (const stat of offlineStats) {
      try {
        const response = await fetch('/api/games/stats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(stat.data),
        });
        
        if (response.ok) {
          await removeFromIndexedDB('offline_game_stats', stat.id);
        }
      } catch (error) {
        console.error('Failed to sync game stat:', error);
      }
    }
  } catch (error) {
    console.error('Game stats sync failed:', error);
  }
}

// Push notification handler
self.addEventListener('push', (event) => {
  const options = {
    body: 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge.png',
    vibrate: [200, 100, 200],
    tag: 'general',
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/icons/view.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/dismiss.png'
      }
    ],
    data: {
      url: '/'
    }
  };
  
  if (event.data) {
    const payload = event.data.json();
    
    // Gaming-specific notification types
    switch (payload.type) {
      case 'achievement':
        options.title = '🏆 Achievement Unlocked!';
        options.body = payload.message;
        options.tag = 'achievement';
        options.requireInteraction = true;
        options.sound = '/sounds/achievement.mp3';
        break;
        
      case 'friend_online':
        options.title = '🎮 Friend Online';
        options.body = `${payload.friendName} is now online`;
        options.tag = 'friend-online';
        break;
        
      case 'tournament':
        options.title = '🏆 Tournament Update';
        options.body = payload.message;
        options.tag = 'tournament';
        options.requireInteraction = true;
        break;
        
      case 'stream':
        options.title = '📺 Live Stream';
        options.body = `${payload.streamerName} is now streaming ${payload.game}`;
        options.tag = 'stream';
        options.actions = [
          { action: 'watch', title: 'Watch Now' },
          { action: 'dismiss', title: 'Later' }
        ];
        break;
        
      default:
        options.title = payload.title || 'IgnisStream';
        options.body = payload.body || 'You have a new notification';
    }
    
    if (payload.url) {
      options.data.url = payload.url;
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(options.title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const action = event.action;
  const url = event.notification.data?.url || '/';
  
  switch (action) {
    case 'view':
    case 'watch':
      event.waitUntil(
        clients.matchAll().then((clientList) => {
          // Try to focus existing tab
          for (const client of clientList) {
            if (client.url === url && 'focus' in client) {
              return client.focus();
            }
          }
          
          // Open new tab if no existing tab found
          if (clients.openWindow) {
            return clients.openWindow(url);
          }
        })
      );
      break;
      
    case 'dismiss':
      // Just close the notification
      break;
      
    default:
      // Default action - open the app
      event.waitUntil(
        clients.openWindow(url)
      );
  }
});

// Utility functions
function isImageRequest(request) {
  const url = new URL(request.url);
  return /\.(jpg|jpeg|png|gif|webp|avif|svg)$/i.test(url.pathname);
}

function isStaticAsset(request) {
  const url = new URL(request.url);
  return /\.(css|js|woff|woff2|ttf|eot|ico)$/i.test(url.pathname) ||
         url.pathname.startsWith('/_next/static/');
}

function isNextBuildAsset(url) {
  return url.pathname.startsWith('/_next/static/');
}

function isExpired(response, ttl) {
  if (!response.headers.has('sw-cache-timestamp')) {
    return true;
  }
  
  const cacheTimestamp = parseInt(response.headers.get('sw-cache-timestamp'));
  return Date.now() - cacheTimestamp > ttl;
}

function createPlaceholderImageResponse() {
  // Simple 1x1 transparent PNG
  const imageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
  const buffer = Uint8Array.from(atob(imageData), c => c.charCodeAt(0));
  
  return new Response(buffer, {
    headers: { 'Content-Type': 'image/png' },
    status: 200
  });
}

// IndexedDB helpers for offline storage
function getFromIndexedDB(storeName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('IgnisStreamDB', 1);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => {
        resolve(getAllRequest.result);
      };
      
      getAllRequest.onerror = () => {
        reject(getAllRequest.error);
      };
    };
    
    request.onerror = () => {
      reject(request.error);
    };
  });
}

function removeFromIndexedDB(storeName, id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('IgnisStreamDB', 1);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const deleteRequest = store.delete(id);
      
      deleteRequest.onsuccess = () => {
        resolve();
      };
      
      deleteRequest.onerror = () => {
        reject(deleteRequest.error);
      };
    };
    
    request.onerror = () => {
      reject(request.error);
    };
  });
}

console.log('IgnisStream Service Worker loaded successfully!');
