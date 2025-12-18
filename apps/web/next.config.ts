import type { NextConfig } from 'next';
import path from 'path';

// Bundle Analyzer (opcional - deshabilitado)
let withBundleAnalyzer = (config: NextConfig) => config;

// PWA Configuration - DESHABILITADO
let withPWA = (config: NextConfig) => config;

const nextConfig: NextConfig = {
  // Deshabilitar checks durante builds de producción
  typescript: {
    ignoreBuildErrors: true,
  },

  // Configuración para el monorepo
  transpilePackages: ['@aprende-y-aplica/shared', '@aprende-y-aplica/ui'],

  // Configuración experimental para permitir directorios externos
  experimental: {
    externalDir: true,
    // Optimizar importaciones de paquetes como lucide-react
    optimizePackageImports: ['lucide-react'],
  },

  // Configuración de Turbopack (Next.js 15+ default)
  turbopack: {
    resolveAlias: {
      '@': path.resolve(__dirname, 'src'),
      '@/features': path.resolve(__dirname, 'src/features'),
      '@/core': path.resolve(__dirname, 'src/core'),
      '@/app': path.resolve(__dirname, 'src/app'),
      '@/components': path.resolve(__dirname, 'src/shared/components'),
      '@/lib': path.resolve(__dirname, 'src/lib'),
      '@/utils': path.resolve(__dirname, 'src/shared/utils'),
      '@/hooks': path.resolve(__dirname, 'src/shared/hooks'),
    },
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
        // Aplicar headers de seguridad a todas las rutas (EXCEPTO las que tienen headers más específicos después)
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
              // Solo forzar HTTPS en producción
              ...(process.env.NODE_ENV === 'production' ? ["upgrade-insecure-requests"] : [])
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
      {
        // Headers permisivos para contenido SCORM (se carga en iframe)
        // IMPORTANTE: Debe ir DESPUÉS del patrón general para que estos headers tengan prioridad
        source: '/api/scorm/content/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:",
              "style-src 'self' 'unsafe-inline' data:",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "connect-src 'self' https:",
              "media-src 'self' data: blob: https:",
              "frame-ancestors 'self'",
            ].join('; ')
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'Cache-Control',
            value: 'private, max-age=3600',
          },
        ],
      },
    ];
  },

    // Configuración de Webpack para resolver alias en el monorepo
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
      '@/features': path.resolve(__dirname, 'src/features'),
      '@/core': path.resolve(__dirname, 'src/core'),
      '@/app': path.resolve(__dirname, 'src/app'),
      '@/components': path.resolve(__dirname, 'src/shared/components'),
      '@/lib': path.resolve(__dirname, 'src/lib'),
      '@/utils': path.resolve(__dirname, 'src/shared/utils'),
      '@/hooks': path.resolve(__dirname, 'src/shared/hooks'),
    };

    // Resolver problema de casing en Windows
    // Normalizar el casing de las rutas para evitar problemas en Windows
    const nodeModulesPath = path.resolve(__dirname, 'node_modules');
    config.resolve.modules = [
      ...(config.resolve.modules || []),
      nodeModulesPath,
    ];

    // Configuración para evitar problemas de casing en Windows
    // Esto normaliza las rutas de módulos para que usen el mismo casing
    if (process.platform === 'win32') {
      // Normalizar todas las rutas a minúsculas para evitar conflictos de casing
      const normalizePath = (p: string) => {
        if (p && typeof p === 'string' && p.match(/^[A-Z]:/)) {
          return p.charAt(0).toLowerCase() + p.slice(1);
        }
        return p;
      };

      // Normalizar el path de node_modules
      const normalizedNodeModules = normalizePath(nodeModulesPath);
      
      config.resolve = {
        ...config.resolve,
        // Deshabilitar symlinks para evitar problemas de casing
        symlinks: false,
        // Normalizar rutas de módulos
        cacheWithContext: false,
        // Asegurar que los módulos se resuelvan con el mismo casing
        modules: [
          ...(config.resolve.modules || []).map((m: any) => 
            typeof m === 'string' ? normalizePath(m) : m
          ),
          normalizedNodeModules,
        ],
      };

      // Interceptar la resolución de módulos para normalizar el casing
      config.resolveLoader = {
        ...config.resolveLoader,
        symlinks: false,
      };
    }

    // Excluir dependencias pesadas del bundle del servidor
    // Estas librerías solo se necesitan en el cliente
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        canvas: 'commonjs canvas',
        sharp: 'commonjs sharp',
        html2canvas: 'commonjs html2canvas',
        jspdf: 'commonjs jspdf',
      });
    }

    // Configuración para librerías que solo funcionan en el cliente
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        canvas: false,
        sharp: false,
      };
    }

    // Excluir rrweb y rrweb-player del bundle del servidor
    // Estas librerías solo funcionan en el navegador y causan errores en el servidor
    if (isServer) {
      // Mantener los alias existentes y agregar exclusiones para rrweb
      config.resolve.alias = {
        ...config.resolve.alias,
        'rrweb': false,
        'rrweb-player': false,
        '@rrweb/types': false,
      };
      
      // También excluir en externals para evitar que se incluya en el bundle
      config.externals = config.externals || [];
      if (typeof config.externals === 'function') {
        const originalExternals = config.externals;
        config.externals = [
          (context: string, request: string, callback: Function) => {
            if (request === 'rrweb' || request === 'rrweb-player' || request === '@rrweb/types') {
              return callback(null, 'commonjs ' + request);
            }
            return originalExternals(context, request, callback);
          },
        ];
      } else if (Array.isArray(config.externals)) {
        config.externals.push('rrweb', 'rrweb-player', '@rrweb/types');
      }
    }

    // Configuración para evitar que webpack analice módulos server-only durante el build del cliente
    // Esto permite que los imports dinámicos funcionen correctamente
    if (!isServer) {
      const webpack = require('webpack');
      // Ignorar módulos server-only durante el análisis estático del cliente
      config.plugins = config.plugins || [];
      config.plugins.push(
        new webpack.IgnorePlugin({
          checkResource(resource: string, context: string) {
            // Ignorar imports de server.ts desde servicios que usan imports dinámicos
            if (resource.includes('lib/supabase/server')) {
              // Ignorar si viene de servicios que usan imports dinámicos
              if (context.includes('features/notifications/services/auto-notifications.service') ||
                  context.includes('features/notifications/services/notification.service') ||
                  context.includes('features/auth/services/questionnaire-validation.service')) {
                return true;
              }
            }
            return false;
          },
        })
      );
    }

    return config;
  },
};

// Aplicar PWA wrapper primero, luego Bundle Analyzer
export default withBundleAnalyzer(withPWA(nextConfig));
