import type { NextConfig } from "next";
import path from "path";
import i18nConfig from "./next-i18next.config";

// Bundle Analyzer (opcional - deshabilitado)
let withBundleAnalyzer: (config: NextConfig) => NextConfig = (config) => config;

// 🚀 PWA Configuration - DESHABILITADO (problema con generate())
// TODO: Investigar error "generate is not a function" con @ducanh2912/next-pwa
// import withPWAInit from '@ducanh2912/next-pwa';
// const withPWA = withPWAInit({ ... });
let withPWA: (config: NextConfig) => NextConfig = (config) => config;

const nextConfig: NextConfig = {
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
  // i18n: i18nConfig.i18n, // Comentado: Next.js 15 con App Router no soporta esta configuración

  // 🔒 Headers de Seguridad HTTP
  async headers() {
    return [
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
              "font-src 'self' https://fonts.gstatic.com data:",
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
          // Permitir el uso de cámara/micrófono desde el mismo origen (self) en desarrollo
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
  webpack: (config, { isServer }) => {
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
          cacheGroups: {
            default: false,
            vendors: false,
            // Chunk separado para Nivo (biblioteca grande)
            nivo: {
              name: 'nivo',
              test: /[\\/]node_modules[\\/]@nivo[\\/]/,
              priority: 20,
              reuseExistingChunk: true,
            },
            // Chunk para otras librerías grandes
            vendor: {
              name: 'vendor',
              test: /[\\/]node_modules[\\/]/,
              priority: 10,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }

    return config;
  },
};

// Aplicar PWA wrapper primero, luego Bundle Analyzer
export default withBundleAnalyzer(withPWA(nextConfig));

