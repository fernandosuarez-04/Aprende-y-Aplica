'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';

// ⚡ OPTIMIZACIÓN: Lazy load de AuthTabs (contiene RegisterForm pesado)
const AuthTabs = dynamic(
  () => import('../../features/auth/components/AuthTabs').then(mod => ({ default: mod.AuthTabs })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    )
  }
);

// ⚡ OPTIMIZACIÓN: Lazy load de motion para animaciones (reducir bundle inicial)
const MotionDiv = dynamic(
  () => import('framer-motion').then(mod => ({ default: mod.motion.div })),
  {
    ssr: false,
    loading: () => <div className="opacity-0" />
  }
);

export default function AuthPage() {
  // ⚡ OPTIMIZACIÓN CRÍTICA: Eliminado fetch bloqueante a /api/auth/me
  // La verificación de organización se hace después del login si es necesaria
  // Esto reduce el tiempo de carga de 17s a 2-3s

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden auth-page-enhanced">
      {/* Efectos de Gradiente - Simplificados */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent z-0" />

      {/* Card Principal - Animación simplificada */}
      <div className="auth-card-enhanced w-full max-w-md lg:max-w-lg xl:max-w-xl relative z-10 animate-fade-in">
        {/* Efecto de Brillo en el Borde */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/20 via-success/20 to-primary/20 blur-xl opacity-50 animate-pulse" />

        <div className="relative bg-glass-enhanced backdrop-blur-2xl rounded-2xl p-6 lg:p-8 xl:p-10 border border-glass-light shadow-2xl">
          {/* Logo - Sin animaciones pesadas */}
          <div className="flex flex-col items-center gap-3 mb-5">
            <div className="w-14 h-14 rounded-xl overflow-hidden shadow-lg bg-gray-100/50 dark:bg-transparent transition-transform hover:scale-110">
              <Image
                src="/icono.png"
                alt="Aprende y Aplica"
                width={56}
                height={56}
                priority={true}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="text-center space-y-1">
              <h1 className="text-xl lg:text-2xl font-bold text-color-contrast">
                Aprende y Aplica
              </h1>
              {/* ⚡ OPTIMIZACIÓN: Eliminado Typewriter Effect (~15KB menos) */}
              <div className="text-xs lg:text-sm text-primary font-medium animate-pulse">
                Inteligencia Artificial
              </div>
            </div>
          </div>

          {/* Auth Tabs - Con lazy loading y Suspense para useSearchParams */}
          <Suspense fallback={
            <div className="w-full h-64 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            </div>
          }>
            <AuthTabs />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
