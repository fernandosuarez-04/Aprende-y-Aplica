import type { NextConfig } from "next";
import path from "path";

// Bundle Analyzer (opcional)
let withBundleAnalyzer: (config: NextConfig) => NextConfig = (config) => config;
try {
  const bundleAnalyzer = require('@next/bundle-analyzer');
  withBundleAnalyzer = bundleAnalyzer({
    enabled: process.env.ANALYZE === 'true',
  });
} catch (e) {
  // Bundle analyzer no disponible, usar función identidad
  console.warn('@next/bundle-analyzer no disponible, continuando sin análisis de bundle');
}

// 🚀 PWA Configuration (opcional)
let withPWA: (config: NextConfig) => NextConfig = (config) => config;
try {
  const nextPWA = require('next-pwa');
  withPWA = nextPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-webfonts',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60 // 1 año
        }
      }
    },
    {
      urlPattern: /^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'google-fonts-stylesheets',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 7 * 24 * 60 * 60 // 1 semana
        }
      }
    },
    {
      urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-font-assets',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 7 * 24 * 60 * 60 // 1 semana
        }
      }
    },
    {
      urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp|avif)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-image-assets',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60 // 24 horas
        }
      }
    },
    {
      urlPattern: /\/_next\/image\?url=.+$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'next-image',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60 // 24 horas
        }
      }
    },
    {
      urlPattern: /\.(?:mp3|wav|ogg)$/i,
      handler: 'CacheFirst',
      options: {
        rangeRequests: true,
        cacheName: 'static-audio-assets',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60 // 24 horas
        }
      }
    },
    {
      urlPattern: /\.(?:mp4)$/i,
      handler: 'CacheFirst',
      options: {
        rangeRequests: true,
        cacheName: 'static-video-assets',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60 // 24 horas
        }
      }
    },
    {
      urlPattern: /\.(?:js)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-js-assets',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60 // 24 horas
        }
      }
    },
    {
      urlPattern: /\.(?:css|less)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-style-assets',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60 // 24 horas
        }
      }
    },
    {
      urlPattern: /\/_next\/data\/.+\/.+\.json$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'next-data',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60 // 24 horas
        }
      }
    },
    {
      urlPattern: /\/api\/.*$/i,
      handler: 'NetworkFirst',
      method: 'GET',
      options: {
        cacheName: 'apis',
        expiration: {
          maxEntries: 16,
          maxAgeSeconds: 24 * 60 * 60 // 24 horas
        },
        networkTimeoutSeconds: 10 // Fallback a cache después de 10s
      }
    },
    {
      urlPattern: /.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'others',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60 // 24 horas
        },
        networkTimeoutSeconds: 10
      }
    }
  ]
  });
} catch (e) {
  // next-pwa no disponible, usar función identidad
  console.warn('next-pwa no disponible, continuando sin PWA');
}

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
  outputFileTracingRoot: '../../',
  
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
              "img-src 'self' data: blob: https://*.supabase.co https://via.placeholder.com https://picsum.photos https://images.unsplash.com https://img.youtube.com",
              "media-src 'self' https://*.supabase.co",
              "connect-src 'self' https://*.supabase.co https://api.openai.com https://accounts.google.com https://oauth2.googleapis.com",
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
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
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

    // Configuración para librerías que solo funcionan en el servidor (pdfkit)
    if (isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
      };
    } else {
      // Configuración para librerías que solo funcionan en el cliente
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        canvas: false,
        pdfkit: false, // pdfkit solo funciona en el servidor
      };
      
      // Excluir pdfkit del bundle del cliente
      config.externals = config.externals || [];
      if (typeof config.externals === 'object' && !Array.isArray(config.externals)) {
        config.externals.push({ pdfkit: 'commonjs pdfkit' });
      }
      
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

