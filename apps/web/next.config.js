const path = require("path");

// Bundle Analyzer (opcional - deshabilitado)
let withBundleAnalyzer = (config) => config;

// PWA Configuration - DESHABILITADO
let withPWA = (config) => config;

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Deshabilitar checks durante builds de producción
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // Configuración para el monorepo
  transpilePackages: ['@aprende-y-aplica/shared', '@aprende-y-aplica/ui'],

  // Configuración experimental para permitir directorios externos
  experimental: {
    externalDir: true,
  },

  // Configuración para resolver advertencia de múltiples lockfiles
  outputFileTracingRoot: path.resolve(__dirname, '../../'),

  // Optimización de imágenes
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    unoptimized: false,
  },

  // Variables de entorno públicas
  env: {
    NEXT_PUBLIC_APP_NAME: 'Aprende y Aplica',
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
  },

  // Headers de Seguridad HTTP
  async headers() {
    return [
      {
        // Headers específicos para chunks estáticos - Caché largo pero con validación
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Headers para otros archivos estáticos
        source: '/_next/static/chunks/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Aplicar headers de seguridad a todas las rutas
        source: '/:path*',
        headers: [
          // Content Security Policy - Protege contra XSS
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com https://apis.google.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data: https://r2cdn.perplexity.ai",
              "img-src 'self' data: blob: https://*.supabase.co https://via.placeholder.com https://picsum.photos https://images.unsplash.com https://img.youtube.com https://*.googleusercontent.com",
              "media-src 'self' blob: https://*.supabase.co",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com https://api.elevenlabs.io https://accounts.google.com https://oauth2.googleapis.com https://www.googleapis.com",
              "frame-src 'self' https://accounts.google.com https://www.youtube.com https://*.supabase.co",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests"
            ].join('; ')
          },
          // Previene clickjacking - no permite que el sitio se cargue en iframes
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          // Previene MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          // Controla información del referrer enviada
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          // Control de permisos del navegador
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(self), geolocation=(self), interest-cohort=()'
          },
          // Previene ataques XSS en navegadores antiguos
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          // Fuerza HTTPS en navegadores modernos (solo en producción)
          ...(process.env.NODE_ENV === 'production' ? [{
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          }] : [])
        ],
      },
    ];
  },

  // Configuración de Webpack para resolver alias en el monorepo
  webpack: (config, { isServer, dev }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/features': path.resolve(__dirname, 'src/features'),
      '@/core': path.resolve(__dirname, 'src/core'),
      '@/app': path.resolve(__dirname, 'src/app'),
      '@/components': path.resolve(__dirname, 'src/shared/components'),
      '@/lib': path.resolve(__dirname, 'src/lib'),
      '@/utils': path.resolve(__dirname, 'src/shared/utils'),
      '@/hooks': path.resolve(__dirname, 'src/shared/hooks'),
    };

    // Configuración para librerías que solo funcionan en el cliente
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };

      // Optimización para Nivo: dividir chunks grandes
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          maxInitialRequests: 25,
          minSize: 20000,
          cacheGroups: {
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
            },
            // Chunk separado para Nivo (biblioteca grande)
            nivo: {
              name: 'nivo',
              test: /[\\/]node_modules[\\/]@nivo[\\/]/,
              priority: 20,
              reuseExistingChunk: true,
              enforce: true,
            },
            // Chunk para otras librerías grandes
            vendor: {
              name: 'vendor',
              test: /[\\/]node_modules[\\/]/,
              priority: 10,
              reuseExistingChunk: true,
              minChunks: 1,
            },
            // Chunk para React y React DOM (muy estables)
            react: {
              name: 'react',
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              priority: 30,
              reuseExistingChunk: true,
              enforce: true,
            },
          },
        },
        // Mejorar nombres de chunks para mejor caché
        moduleIds: dev ? 'named' : 'deterministic',
        chunkIds: dev ? 'named' : 'deterministic',
      };
    }

    return config;
  },
};

// Aplicar PWA wrapper primero, luego Bundle Analyzer
module.exports = withBundleAnalyzer(withPWA(nextConfig));
