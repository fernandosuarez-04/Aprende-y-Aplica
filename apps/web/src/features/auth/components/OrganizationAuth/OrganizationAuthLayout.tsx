'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface OrganizationAuthLayoutProps {
  organization: {
    id: string;
    name: string;
    logo_url: string | null;
    description?: string | null;
    brand_color_primary?: string | null;
    brand_color_secondary?: string | null;
    brand_font_family?: string | null;
  };
  children: React.ReactNode;
  isLoading?: boolean;
  error?: string | null;
}

export function OrganizationAuthLayout({
  organization,
  children,
  isLoading = false,
  error = null,
}: OrganizationAuthLayoutProps) {
  const logoUrl = organization.logo_url || '/icono.png';
  const primaryColor = organization.brand_color_primary || '#3b82f6';
  const secondaryColor = organization.brand_color_secondary || '#10b981';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden auth-page-enhanced">
      {/* Efectos de Gradiente con Colores de la Organización */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          background: `radial-gradient(circle at 30% 50%, ${primaryColor}15, transparent 50%), radial-gradient(circle at 70% 50%, ${secondaryColor}15, transparent 50%)`
        }}
      />

      {/* Card Principal con Animación */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="auth-card-enhanced w-full max-w-md lg:max-w-4xl xl:max-w-5xl relative z-10"
      >
        {/* Efecto de Brillo en el Borde con Colores de la Organización */}
        <div 
          className="absolute inset-0 rounded-2xl blur-xl opacity-50 animate-pulse"
          style={{
            background: `linear-gradient(to right, ${primaryColor}20, ${secondaryColor}20, ${primaryColor}20)`
          }}
        />
        
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
              style={{
                border: `2px solid ${primaryColor}40`
              }}
            >
              <Image
                src={logoUrl}
                alt={`${organization.name} Logo`}
                width={64}
                height={64}
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/icono.png';
                }}
              />
            </motion.div>
            
            <div className="text-center space-y-3">
              <motion.h1 
                className="text-2xl lg:text-3xl font-bold text-color-contrast"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.6, ease: 'easeOut' }}
                style={{
                  fontFamily: organization.brand_font_family || undefined,
                  color: primaryColor
                }}
              >
                {organization.name}
              </motion.h1>
              {organization.description && (
                <motion.p 
                  className="text-sm lg:text-base text-text-secondary"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                >
                  {organization.description}
                </motion.p>
              )}
            </div>
          </motion.div>

          {/* Estados de Carga y Error */}
          {isLoading && (
            <div className="flex items-center justify-center py-10">
              <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Contenido Principal */}
          {!isLoading && !error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.7, ease: 'easeOut' }}
            >
              {children}
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

