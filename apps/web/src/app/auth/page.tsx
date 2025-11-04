'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { AuthTabs } from '../../features/auth/components/AuthTabs';
import Typewriter from 'typewriter-effect';
import { getOrganizationLoginUrl } from '@/lib/organization-auth';

export default function AuthPage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Verificar si el usuario tiene organización y redirigir si es necesario
    const checkOrganization = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user?.organization?.slug) {
            // Redirigir a login personalizado si tiene slug
            const customLoginUrl = `/auth/${data.user.organization.slug}`;
            router.replace(customLoginUrl);
            return;
          }
        }
      } catch (error) {
        console.error('Error checking organization:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkOrganization();
  }, [router]);

  // Mostrar loading mientras se verifica la organización
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden auth-page-enhanced">
      {/* Efectos de Gradiente Adicionales */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent z-0" />

      {/* Card Principal con Animación */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="auth-card-enhanced w-full max-w-md lg:max-w-4xl xl:max-w-5xl relative z-10"
      >
        {/* Efecto de Brillo en el Borde */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/20 via-success/20 to-primary/20 blur-xl opacity-50 animate-pulse" />
        
        <div className="relative bg-glass-enhanced backdrop-blur-2xl rounded-2xl p-8 lg:p-12 xl:p-20 border border-glass-light shadow-2xl">
          {/* Logo con Animación */}
          <motion.div
            className="flex flex-col items-center gap-6 mb-10"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7, ease: 'easeOut' }}
          >
            <motion.div
              className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Image
                src="/icono.png"
                alt="Aprende y Aplica"
                width={64}
                height={64}
                className="w-full h-full object-contain"
              />
            </motion.div>
            
            <div className="text-center space-y-3">
              <motion.h1 
                className="text-2xl lg:text-3xl font-bold text-color-contrast"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.6, ease: 'easeOut' }}
              >
                Aprende y Aplica
              </motion.h1>
              <motion.div 
                className="text-sm lg:text-base text-primary font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <Typewriter
                  options={{
                    strings: [
                      'Inteligencia Artificial',
                      'Machine Learning',
                      'Deep Learning',
                      'Tu Futuro en IA',
                    ],
                    autoStart: true,
                    loop: true,
                    delay: 80,
                    deleteSpeed: 50,
                  }}
                />
              </motion.div>
            </div>
          </motion.div>

          {/* Auth Tabs con Animación */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.7, ease: 'easeOut' }}
          >
            <AuthTabs />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
