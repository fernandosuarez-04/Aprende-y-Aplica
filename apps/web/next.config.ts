import type { NextConfig } from "next";
import path from "path";

// Bundle Analyzer
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

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
    }

    return config;
  },
};

export default withBundleAnalyzer(nextConfig);

