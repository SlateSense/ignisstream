/**
 * Advanced Image Optimization System for IgnisStream
 * Handles compression, format conversion, and responsive images
 */

import sharp from 'sharp';
import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import { join } from 'path';

interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png' | 'auto';
  progressive?: boolean;
  blur?: number;
  grayscale?: boolean;
  compressionLevel?: number;
  background?: string;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

interface ResponsiveImageSet {
  sizes: Array<{
    width: number;
    url: string;
    format: string;
  }>;
  placeholder: string;
  aspectRatio: number;
}

interface OptimizationResult {
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  format: string;
  url: string;
  width: number;
  height: number;
}

export class ImageOptimizer {
  private cacheDir: string;
  private maxCacheSize: number; // bytes
  private supportedFormats: Set<string>;

  constructor(options: {
    cacheDir?: string;
    maxCacheSize?: number;
  } = {}) {
    this.cacheDir = options.cacheDir || join(process.cwd(), '.next', 'cache', 'images');
    this.maxCacheSize = options.maxCacheSize || 1024 * 1024 * 1024; // 1GB
    this.supportedFormats = new Set(['jpeg', 'jpg', 'png', 'webp', 'avif', 'gif', 'svg']);
    
    this.ensureCacheDir();
  }

  private async ensureCacheDir() {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create cache directory:', error);
    }
  }

  // Main optimization function
  async optimizeImage(
    input: Buffer | string,
    options: ImageOptimizationOptions = {}
  ): Promise<OptimizationResult> {
    try {
      const inputBuffer = typeof input === 'string' 
        ? await fs.readFile(input)
        : input;

      const originalSize = inputBuffer.length;
      
      // Generate cache key
      const cacheKey = this.generateCacheKey(inputBuffer, options);
      const cachedResult = await this.getCachedResult(cacheKey);
      
      if (cachedResult) {
        return cachedResult;
      }

      // Create Sharp instance
      let image = sharp(inputBuffer);
      
      // Get image metadata
      const metadata = await image.metadata();
      
      // Determine optimal format
      const targetFormat = this.determineOptimalFormat(
        options.format || 'auto',
        metadata.format || 'jpeg'
      );

      // Apply transformations
      image = await this.applyTransformations(image, options, metadata);

      // Apply format-specific optimizations
      image = this.applyFormatOptimization(image, targetFormat, options);

      // Generate optimized image
      const { data: optimizedBuffer, info } = await image.toBuffer({ resolveWithObject: true });
      
      const result: OptimizationResult = {
        originalSize,
        optimizedSize: optimizedBuffer.length,
        compressionRatio: ((originalSize - optimizedBuffer.length) / originalSize) * 100,
        format: targetFormat,
        url: await this.saveOptimizedImage(cacheKey, optimizedBuffer, targetFormat),
        width: info.width,
        height: info.height,
      };

      // Cache the result
      await this.cacheResult(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error('Image optimization failed:', error);
      throw error;
    }
  }

  // Generate responsive image set
  async generateResponsiveImages(
    input: Buffer | string,
    breakpoints: number[] = [320, 640, 768, 1024, 1280, 1920],
    options: Omit<ImageOptimizationOptions, 'width'> = {}
  ): Promise<ResponsiveImageSet> {
    const inputBuffer = typeof input === 'string' 
      ? await fs.readFile(input)
      : input;

    const metadata = await sharp(inputBuffer).metadata();
    const originalWidth = metadata.width || 1920;
    const originalHeight = metadata.height || 1080;
    const aspectRatio = originalWidth / originalHeight;

    // Filter breakpoints to not upscale
    const validBreakpoints = breakpoints.filter(width => width <= originalWidth);
    
    const sizes = await Promise.all(
      validBreakpoints.map(async (width) => {
        const result = await this.optimizeImage(inputBuffer, {
          ...options,
          width,
          height: Math.round(width / aspectRatio),
        });

        return {
          width,
          url: result.url,
          format: result.format,
        };
      })
    );

    // Generate placeholder (blur, low quality)
    const placeholderResult = await this.optimizeImage(inputBuffer, {
      width: 20,
      height: Math.round(20 / aspectRatio),
      quality: 10,
      blur: 5,
      format: 'jpeg',
    });

    return {
      sizes,
      placeholder: placeholderResult.url,
      aspectRatio,
    };
  }

  private determineOptimalFormat(requestedFormat: string, originalFormat: string): string {
    if (requestedFormat === 'auto') {
      // Prefer modern formats for better compression
      if (this.supportsWebP()) return 'webp';
      if (this.supportsAVIF()) return 'avif';
      return originalFormat === 'png' ? 'png' : 'jpeg';
    }
    
    return requestedFormat;
  }

  private async applyTransformations(
    image: sharp.Sharp,
    options: ImageOptimizationOptions,
    metadata: sharp.Metadata
  ): Promise<sharp.Sharp> {
    // Resize if dimensions provided
    if (options.width || options.height) {
      image = image.resize({
        width: options.width,
        height: options.height,
        fit: options.fit || 'cover',
        background: options.background || { r: 255, g: 255, b: 255, alpha: 1 },
        withoutEnlargement: true,
      });
    }

    // Apply filters
    if (options.blur) {
      image = image.blur(options.blur);
    }

    if (options.grayscale) {
      image = image.grayscale();
    }

    return image;
  }

  private applyFormatOptimization(
    image: sharp.Sharp,
    format: string,
    options: ImageOptimizationOptions
  ): sharp.Sharp {
    const quality = options.quality || 85;
    const progressive = options.progressive !== false;

    switch (format) {
      case 'webp':
        return image.webp({
          quality,
          progressive,
          effort: 6, // Higher effort for better compression
        });

      case 'avif':
        return image.avif({
          quality,
          effort: 9, // Maximum effort for AVIF
        });

      case 'jpeg':
        return image.jpeg({
          quality,
          progressive,
          mozjpeg: true, // Use mozjpeg for better compression
        });

      case 'png':
        return image.png({
          progressive,
          compressionLevel: options.compressionLevel || 9,
        });

      default:
        return image;
    }
  }

  private generateCacheKey(buffer: Buffer, options: ImageOptimizationOptions): string {
    const optionsString = JSON.stringify(options);
    const hash = createHash('sha256');
    hash.update(buffer);
    hash.update(optionsString);
    return hash.digest('hex');
  }

  private async getCachedResult(cacheKey: string): Promise<OptimizationResult | null> {
    try {
      const metadataPath = join(this.cacheDir, `${cacheKey}.json`);
      const metadataBuffer = await fs.readFile(metadataPath);
      return JSON.parse(metadataBuffer.toString());
    } catch {
      return null;
    }
  }

  private async cacheResult(cacheKey: string, result: OptimizationResult): Promise<void> {
    try {
      const metadataPath = join(this.cacheDir, `${cacheKey}.json`);
      await fs.writeFile(metadataPath, JSON.stringify(result));
    } catch (error) {
      console.error('Failed to cache optimization result:', error);
    }
  }

  private async saveOptimizedImage(
    cacheKey: string,
    buffer: Buffer,
    format: string
  ): Promise<string> {
    const fileName = `${cacheKey}.${format}`;
    const filePath = join(this.cacheDir, fileName);
    
    await fs.writeFile(filePath, buffer);
    
    // Return URL (this would be served by your CDN/static file server)
    return `/optimized/${fileName}`;
  }

  // Check browser support (would be determined by request headers in real implementation)
  private supportsWebP(): boolean {
    return true; // Assume support for server-side optimization
  }

  private supportsAVIF(): boolean {
    return true; // Assume support for server-side optimization
  }

  // Batch optimization for multiple images
  async optimizeBatch(
    inputs: Array<{ buffer: Buffer; options?: ImageOptimizationOptions }>,
    concurrency = 3
  ): Promise<OptimizationResult[]> {
    const results: OptimizationResult[] = [];
    
    for (let i = 0; i < inputs.length; i += concurrency) {
      const batch = inputs.slice(i, i + concurrency);
      const batchResults = await Promise.all(
        batch.map(({ buffer, options }) => 
          this.optimizeImage(buffer, options).catch(error => {
            console.error('Batch optimization error:', error);
            return null;
          })
        )
      );
      
      results.push(...batchResults.filter(Boolean) as OptimizationResult[]);
    }

    return results;
  }

  // Cache management
  async cleanupCache(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    try {
      const files = await fs.readdir(this.cacheDir);
      const now = Date.now();

      for (const file of files) {
        const filePath = join(this.cacheDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
        }
      }
    } catch (error) {
      console.error('Cache cleanup failed:', error);
    }
  }

  async getCacheSize(): Promise<number> {
    try {
      const files = await fs.readdir(this.cacheDir);
      let totalSize = 0;

      for (const file of files) {
        const filePath = join(this.cacheDir, file);
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
      }

      return totalSize;
    } catch {
      return 0;
    }
  }
}

// Gaming-specific image optimization presets
export const gamingImagePresets = {
  avatar: {
    width: 200,
    height: 200,
    quality: 90,
    format: 'webp' as const,
    fit: 'cover' as const,
  },
  
  gameIcon: {
    width: 64,
    height: 64,
    quality: 95,
    format: 'webp' as const,
    fit: 'cover' as const,
  },

  gameBanner: {
    width: 1200,
    height: 400,
    quality: 85,
    format: 'webp' as const,
    fit: 'cover' as const,
  },

  screenshot: {
    width: 1920,
    height: 1080,
    quality: 80,
    format: 'webp' as const,
    progressive: true,
  },

  thumbnail: {
    width: 300,
    height: 200,
    quality: 85,
    format: 'webp' as const,
    fit: 'cover' as const,
  },

  profileHeader: {
    width: 1200,
    height: 300,
    quality: 80,
    format: 'webp' as const,
    fit: 'cover' as const,
  },
};

// Next.js Image Component Optimization
export class NextImageOptimizer {
  private optimizer: ImageOptimizer;

  constructor() {
    this.optimizer = new ImageOptimizer();
  }

  // Custom loader for Next.js Image component
  imageLoader = ({ src, width, quality }: {
    src: string;
    width: number;
    quality?: number;
  }): string => {
    const params = new URLSearchParams({
      url: src,
      w: width.toString(),
      q: (quality || 75).toString(),
    });

    return `/api/image-optimizer?${params.toString()}`;
  };

  // API route handler for image optimization
  async handleImageRequest(
    url: string,
    width: number,
    quality: number = 75
  ): Promise<{ buffer: Buffer; contentType: string }> {
    try {
      // Fetch original image
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      
      // Optimize image
      const result = await this.optimizer.optimizeImage(buffer, {
        width,
        quality,
        format: 'auto',
      });

      // Read optimized image
      const optimizedBuffer = await fs.readFile(result.url.replace('/optimized/', ''));
      
      return {
        buffer: optimizedBuffer,
        contentType: `image/${result.format}`,
      };
    } catch (error) {
      console.error('Image optimization request failed:', error);
      throw error;
    }
  }
}

// Initialize optimizers
export const imageOptimizer = new ImageOptimizer();
export const nextImageOptimizer = new NextImageOptimizer();

// Utility functions for React components
export const useOptimizedImage = (
  src: string,
  options: ImageOptimizationOptions = {}
) => {
  // This would be a React hook in practice
  const optimizedSrc = `/api/image-optimizer?${new URLSearchParams({
    url: src,
    ...Object.fromEntries(
      Object.entries(options).map(([k, v]) => [k, String(v)])
    ),
  }).toString()}`;

  return optimizedSrc;
};

export const generateImageSrcSet = (
  src: string,
  sizes: number[] = [640, 768, 1024, 1280, 1920]
): string => {
  return sizes
    .map(size => {
      const optimizedSrc = useOptimizedImage(src, { width: size });
      return `${optimizedSrc} ${size}w`;
    })
    .join(', ');
};
