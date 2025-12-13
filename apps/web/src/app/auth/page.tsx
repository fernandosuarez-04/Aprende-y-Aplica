'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Typewriter from 'typewriter-effect';

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
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-4 relative overflow-hidden auth-page-enhanced">
      {/* Efectos de Gradiente - Simplificados */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent z-0" />

      {/* Card Principal - Animación simplificada */}
      <div className="auth-card-enhanced w-full max-w-md lg:max-w-lg xl:max-w-xl relative z-10 animate-fade-in">
        {/* Efecto de Brillo en el Borde - Mejorado */}
        <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-r from-primary/20 via-success/20 to-primary/20 blur-xl opacity-50 animate-pulse" />

        <div 
          className="relative backdrop-blur-2xl p-3 sm:p-5 lg:p-7 xl:p-9 shadow-2xl rounded-3xl border overflow-hidden transition-all duration-500 dark:bg-slate-900/85 bg-white/95 dark:border-slate-700/50 border-gray-200/50 dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),0_0_0_1px_rgba(71,85,105,0.2)] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15),0_0_0_1px_rgba(0,0,0,0.1)]" 
        >
          {/* Logo - Optimizado para mobile */}
          <div className="flex flex-col items-center gap-1.5 sm:gap-2.5 mb-2.5 sm:mb-4">
            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl overflow-hidden shadow-lg bg-gray-100/50 dark:bg-transparent transition-transform hover:scale-110">
              <Image
                src="/icono.png"
                alt="Aprende y Aplica"
                width={56}
                height={56}
                priority={true}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="text-center space-y-0.5 sm:space-y-1">
              <h1 className="text-base sm:text-lg lg:text-xl font-bold text-color-contrast">
                Aprende y Aplica
              </h1>
              {/* Typewriter Effect Restaurado */}
              <div className="text-xs sm:text-xs lg:text-sm text-primary font-medium h-4 sm:h-5 flex items-center justify-center">
                <Typewriter
                  options={{
                    strings: [
                      'Inteligencia Artificial',
                      'Machine Learning',
                      'Deep Learning',
                      'Data Science',
                      'Automatización',
                    ],
                    autoStart: true,
                    loop: true,
                    delay: 75,
                    deleteSpeed: 50,
                    cursor: '|',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Auth Tabs - Con lazy loading y Suspense para useSearchParams */}
          <Suspense fallback={
            <div className="w-full h-40 sm:h-56 flex items-center justify-center">
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
