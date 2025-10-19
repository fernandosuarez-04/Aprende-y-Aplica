import type { NextConfig } from "next";

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
    domains: [],
    unoptimized: false,
  },
  
  // Variables de entorno públicas
  env: {
    NEXT_PUBLIC_APP_NAME: 'Aprende y Aplica',
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
  },
};

export default nextConfig;

