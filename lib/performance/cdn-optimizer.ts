/**
 * CDN and Edge Caching Optimization for IgnisStream
 * Implements global content delivery and intelligent caching strategies
 */

interface CDNConfig {
  domains: {
    images: string;
    videos: string;
    assets: string;
    api: string;
  };
  regions: string[];
  cacheTTL: {
    static: number;
    dynamic: number;
    api: number;
    images: number;
  };
}

interface CacheStrategy {
  key: string;
  ttl: number;
  tags: string[];
  vary?: string[];
  staleWhileRevalidate?: number;
}

export class CDNOptimizer {
  private config: CDNConfig;
  private cacheStrategies: Map<string, CacheStrategy>;

  constructor(config: CDNConfig) {
    this.config = config;
    this.cacheStrategies = new Map();
    this.initializeStrategies();
  }

  private initializeStrategies() {
    // Static assets (CSS, JS, fonts)
    this.cacheStrategies.set('static', {
      key: 'static-assets',
      ttl: 31536000, // 1 year
      tags: ['static', 'assets'],
      vary: ['Accept-Encoding'],
    });

    // Images and media
    this.cacheStrategies.set('images', {
      key: 'media-content',
      ttl: 2592000, // 30 days
      tags: ['images', 'media'],
      vary: ['Accept', 'Accept-Encoding'],
      staleWhileRevalidate: 86400, // 24 hours
    });

    // API responses
    this.cacheStrategies.set('api', {
      key: 'api-responses',
      ttl: 300, // 5 minutes
      tags: ['api', 'dynamic'],
      vary: ['Authorization', 'Accept-Language'],
      staleWhileRevalidate: 60, // 1 minute
    });

    // Game data (relatively static)
    this.cacheStrategies.set('gamedata', {
      key: 'game-metadata',
      ttl: 3600, // 1 hour
      tags: ['games', 'metadata'],
      staleWhileRevalidate: 300, // 5 minutes
    });

    // User-generated content
    this.cacheStrategies.set('ugc', {
      key: 'user-content',
      ttl: 1800, // 30 minutes
      tags: ['posts', 'user-content'],
      vary: ['Authorization'],
      staleWhileRevalidate: 120, // 2 minutes
    });
  }

  // Generate optimized URL with CDN parameters
  generateCDNUrl(
    originalUrl: string,
    type: 'images' | 'videos' | 'assets',
    optimizations?: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'webp' | 'avif' | 'auto';
      blur?: boolean;
    }
  ): string {
    const cdnDomain = this.config.domains[type];
    const url = new URL(originalUrl, cdnDomain);

    if (optimizations) {
      const params = new URLSearchParams();
      
      if (optimizations.width) params.set('w', optimizations.width.toString());
      if (optimizations.height) params.set('h', optimizations.height.toString());
      if (optimizations.quality) params.set('q', optimizations.quality.toString());
      if (optimizations.format) params.set('f', optimizations.format);
      if (optimizations.blur) params.set('blur', '10');

      url.search = params.toString();
    }

    return url.toString();
  }

  // Generate cache headers for responses
  generateCacheHeaders(strategy: string, customTTL?: number): Record<string, string> {
    const cacheStrategy = this.cacheStrategies.get(strategy);
    if (!cacheStrategy) {
      throw new Error(`Unknown cache strategy: ${strategy}`);
    }

    const ttl = customTTL || cacheStrategy.ttl;
    const headers: Record<string, string> = {};

    // Cache-Control header
    const cacheControl = [`public`, `max-age=${ttl}`];
    
    if (cacheStrategy.staleWhileRevalidate) {
      cacheControl.push(`stale-while-revalidate=${cacheStrategy.staleWhileRevalidate}`);
    }

    headers['Cache-Control'] = cacheControl.join(', ');

    // ETag for validation
    headers['ETag'] = `"${cacheStrategy.key}-${Date.now()}"`;

    // Vary header for conditional caching
    if (cacheStrategy.vary) {
      headers['Vary'] = cacheStrategy.vary.join(', ');
    }

    // CDN-specific headers
    headers['X-Cache-Tags'] = cacheStrategy.tags.join(',');
    headers['X-CDN-Cache'] = 'HIT';

    return headers;
  }

  // Purge cache by tags
  async purgeCache(tags: string[], regions?: string[]): Promise<void> {
    const targetRegions = regions || this.config.regions;

    try {
      const purgePromises = targetRegions.map(async (region) => {
        // Simulate CDN purge API call
        const response = await fetch(`${this.config.domains.api}/purge`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tags,
            region,
            timestamp: Date.now(),
          }),
        });

        if (!response.ok) {
          throw new Error(`Purge failed for region ${region}: ${response.statusText}`);
        }

        return response.json();
      });

      await Promise.all(purgePromises);
      console.log(`Cache purged for tags: ${tags.join(', ')} in regions: ${targetRegions.join(', ')}`);
    } catch (error) {
      console.error('Cache purge failed:', error);
      throw error;
    }
  }

  // Smart cache warming for critical content
  async warmCache(urls: string[], priority: 'high' | 'medium' | 'low' = 'medium'): Promise<void> {
    const batchSize = priority === 'high' ? 10 : priority === 'medium' ? 5 : 2;
    
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      
      const warmPromises = batch.map(async (url) => {
        try {
          const response = await fetch(url, { method: 'HEAD' });
          return { url, success: response.ok, status: response.status };
        } catch (error) {
          return { url, success: false, error: (error as Error).message };
        }
      });

      const results = await Promise.all(warmPromises);
      console.log(`Cache warmed for batch ${Math.floor(i / batchSize) + 1}:`, results);

      // Add delay between batches to avoid overwhelming the CDN
      if (i + batchSize < urls.length) {
        await new Promise(resolve => setTimeout(resolve, priority === 'high' ? 100 : 500));
      }
    }
  }

  // Edge compute function for dynamic content optimization
  generateEdgeFunction(type: 'image-resize' | 'api-cache' | 'geo-redirect'): string {
    switch (type) {
      case 'image-resize':
        return `
          addEventListener('fetch', event => {
            event.respondWith(handleImageRequest(event.request));
          });

          async function handleImageRequest(request) {
            const url = new URL(request.url);
            const params = url.searchParams;
            
            // Extract optimization parameters
            const width = params.get('w');
            const height = params.get('h');
            const quality = params.get('q') || '80';
            const format = params.get('f') || 'webp';
            
            // Generate cache key
            const cacheKey = \`\${url.pathname}?w=\${width}&h=\${height}&q=\${quality}&f=\${format}\`;
            const cache = caches.default;
            
            // Check cache first
            let response = await cache.match(cacheKey);
            if (response) {
              return response;
            }
            
            // Fetch and optimize image
            const originalResponse = await fetch(url.origin + url.pathname);
            if (!originalResponse.ok) return originalResponse;
            
            // Apply transformations (simplified)
            const transformedResponse = new Response(await originalResponse.arrayBuffer(), {
              status: 200,
              headers: {
                'Content-Type': \`image/\${format}\`,
                'Cache-Control': 'public, max-age=31536000',
                'X-Edge-Cache': 'MISS'
              }
            });
            
            // Cache the result
            event.waitUntil(cache.put(cacheKey, transformedResponse.clone()));
            return transformedResponse;
          }
        `;

      case 'api-cache':
        return `
          addEventListener('fetch', event => {
            event.respondWith(handleAPIRequest(event.request));
          });

          async function handleAPIRequest(request) {
            const url = new URL(request.url);
            
            // Only cache GET requests
            if (request.method !== 'GET') {
              return fetch(request);
            }
            
            // Generate cache key including user context
            const auth = request.headers.get('Authorization');
            const userHash = auth ? btoa(auth).slice(0, 8) : 'anonymous';
            const cacheKey = \`\${url.pathname}\${url.search}-\${userHash}\`;
            
            const cache = caches.default;
            let response = await cache.match(cacheKey);
            
            if (response) {
              // Check if stale
              const cacheTime = response.headers.get('X-Cache-Time');
              const maxAge = parseInt(response.headers.get('X-Max-Age') || '300');
              
              if (Date.now() - parseInt(cacheTime) < maxAge * 1000) {
                return new Response(response.body, {
                  ...response,
                  headers: { ...response.headers, 'X-Edge-Cache': 'HIT' }
                });
              }
            }
            
            // Fetch fresh data
            response = await fetch(request);
            if (response.ok) {
              const cachedResponse = new Response(response.body, {
                ...response,
                headers: {
                  ...response.headers,
                  'X-Cache-Time': Date.now().toString(),
                  'X-Max-Age': '300',
                  'X-Edge-Cache': 'MISS'
                }
              });
              
              event.waitUntil(cache.put(cacheKey, cachedResponse.clone()));
              return cachedResponse;
            }
            
            return response;
          }
        `;

      case 'geo-redirect':
        return `
          addEventListener('fetch', event => {
            event.respondWith(handleGeoRequest(event.request));
          });

          async function handleGeoRequest(request) {
            const country = request.cf.country;
            const url = new URL(request.url);
            
            // Region-specific API endpoints
            const regionMap = {
              'US': 'us-east-1.api.ignisstream.com',
              'GB': 'eu-west-1.api.ignisstream.com',
              'JP': 'ap-east-1.api.ignisstream.com',
              'AU': 'ap-southeast-2.api.ignisstream.com',
              'BR': 'sa-east-1.api.ignisstream.com'
            };
            
            const regionalEndpoint = regionMap[country] || regionMap['US'];
            
            if (url.hostname !== regionalEndpoint) {
              url.hostname = regionalEndpoint;
              return Response.redirect(url.toString(), 302);
            }
            
            return fetch(request);
          }
        `;

      default:
        return '';
    }
  }

  // Analytics for cache performance
  async getCacheAnalytics(timeRange: '1h' | '24h' | '7d' = '24h'): Promise<{
    hitRate: number;
    bandwidth: number;
    requests: number;
    topMissedUrls: string[];
    regionPerformance: Record<string, { hitRate: number; latency: number }>;
  }> {
    try {
      const response = await fetch(`${this.config.domains.api}/analytics/cache`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeRange }),
      });

      const data = await response.json();
      return {
        hitRate: data.cache_hit_ratio || 0,
        bandwidth: data.bandwidth_saved || 0,
        requests: data.total_requests || 0,
        topMissedUrls: data.top_missed_urls || [],
        regionPerformance: data.region_stats || {},
      };
    } catch (error) {
      console.error('Failed to fetch cache analytics:', error);
      return {
        hitRate: 0,
        bandwidth: 0,
        requests: 0,
        topMissedUrls: [],
        regionPerformance: {},
      };
    }
  }
}

// Configuration for IgnisStream CDN
export const ignisCDNConfig: CDNConfig = {
  domains: {
    images: process.env.NODE_ENV === 'production' 
      ? 'https://cdn-images.ignisstream.com'
      : 'http://localhost:3000',
    videos: process.env.NODE_ENV === 'production'
      ? 'https://cdn-videos.ignisstream.com' 
      : 'http://localhost:3000',
    assets: process.env.NODE_ENV === 'production'
      ? 'https://cdn-assets.ignisstream.com'
      : 'http://localhost:3000',
    api: process.env.NODE_ENV === 'production'
      ? 'https://api.ignisstream.com'
      : 'http://localhost:3000/api',
  },
  regions: ['us-east-1', 'eu-west-1', 'ap-east-1', 'ap-southeast-2', 'sa-east-1'],
  cacheTTL: {
    static: 31536000, // 1 year
    dynamic: 300, // 5 minutes  
    api: 60, // 1 minute
    images: 2592000, // 30 days
  },
};

// Initialize CDN optimizer
export const cdnOptimizer = new CDNOptimizer(ignisCDNConfig);

// Helper hooks for React components
export const useCDNImage = (src: string, optimizations?: Parameters<CDNOptimizer['generateCDNUrl']>[2]) => {
  if (!src) return src;
  
  try {
    return cdnOptimizer.generateCDNUrl(src, 'images', {
      format: 'auto',
      quality: 85,
      ...optimizations,
    });
  } catch {
    return src; // Fallback to original URL
  }
};

export const useCDNVideo = (src: string) => {
  if (!src) return src;
  
  try {
    return cdnOptimizer.generateCDNUrl(src, 'videos');
  } catch {
    return src;
  }
};
