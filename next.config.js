/** @type {import('next').NextConfig} */
const nextConfig = {
  // Image security and optimization configuration
  images: {
    remotePatterns: [
      // Restrict to specific trusted domains instead of wildcard
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.jsdelivr.net',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.in',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
      },
      {
        protocol: 'https',
        hostname: 'steamcdn-a.akamaihd.net',
      },
      {
        protocol: 'https',
        hostname: 'cdn2.steamgriddb.com',
      }
    ],
    formats: ['image/avif', 'image/webp'], // AVIF first for better compression
    deviceSizes: [640, 750, 828, 1080, 1200, 1920], // Reduced for faster loading
    imageSizes: [16, 32, 48, 64, 96, 128, 256], // Reduced sizes
    minimumCacheTTL: 60 * 60 * 24 * 30, // Cache images for 30 days
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate'
          }
        ]
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()'
          }
        ]
      }
    ]
  },

  // Webpack configuration for security
  webpack: (config, { dev, isServer }) => {
    // Remove source maps in production for security
    if (!dev && !isServer) {
      config.devtool = false
    }

    // Add security-related optimizations
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    }

    return config
  },

  // Experimental features for better security and performance
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
    optimizePackageImports: [
      'lucide-react', 
      'framer-motion', 
      '@radix-ui/react-dialog', 
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-avatar',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      'date-fns'
    ],
    // Enable faster builds
    optimizeCss: false,
    // Reduce memory usage
    workerThreads: false,
    // Optimize server performance
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // Disable X-Powered-By header
  poweredByHeader: false,

  // Enable compression
  compress: true,

  // Optimize bundle
  swcMinify: true,
  
  // Output standalone for faster deployment
  output: 'standalone',

  // Performance optimizations
  reactStrictMode: true,
  
  // Optimize production builds
  productionBrowserSourceMaps: false,
  
  // Reduce bundle size
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
    },
  },
  
  // Compiler options
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  // Redirect configuration
  async redirects() {
    return [
      // Redirect HTTP to HTTPS in production
      ...(process.env.NODE_ENV === 'production' ? [
        {
          source: '/:path*',
          has: [
            {
              type: 'header',
              key: 'x-forwarded-proto',
              value: 'http',
            },
          ],
          destination: 'https://ignisstream.com/:path*',
          permanent: true,
        },
      ] : []),
    ]
  },

  // Environment variable validation
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
}

module.exports = nextConfig
