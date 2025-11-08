'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { getBackgroundStyle, generateCSSVariables } from '../../../business-panel/utils/styles';
import type { StyleConfig } from '../../../business-panel/hooks/useOrganizationStyles';

interface OrganizationAuthLayoutProps {
  organization: {
    id: string;
    name: string;
    logo_url: string | null;
    description?: string | null;
    brand_color_primary?: string | null;
    brand_color_secondary?: string | null;
    brand_font_family?: string | null;
    brand_favicon_url?: string | null;
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
  const faviconUrl = organization.brand_favicon_url || organization.logo_url || '/icono.png';
  const primaryColor = organization.brand_color_primary || '#3b82f6';
  const secondaryColor = organization.brand_color_secondary || '#10b981';
  const [loginStyles, setLoginStyles] = useState<StyleConfig | null>(null);

  // Obtener estilos de login desde la API
  useEffect(() => {
    const fetchLoginStyles = async () => {
      try {
        // Obtener el slug desde la organización si está disponible
        const slug = (organization as any).slug;
        if (!slug) return;

        const response = await fetch(`/api/organizations/${slug}/styles`, {
          credentials: 'include',
        });

        const data = await response.json();
        if (data.success && data.styles?.login) {
          setLoginStyles(data.styles.login);
        }
      } catch (error) {
        // console.error('Error fetching login styles:', error);
      }
    };

    fetchLoginStyles();
  }, [organization]);

  // Aplicar estilos personalizados de login
  const backgroundStyle = getBackgroundStyle(loginStyles);
  const cssVariables = generateCSSVariables(loginStyles);

  // Usar colores de estilos personalizados si están disponibles
  const finalPrimaryColor = loginStyles?.primary_button_color || primaryColor;
  const finalSecondaryColor = loginStyles?.secondary_button_color || secondaryColor;
  
  // Agregar variable para el fondo de tarjeta si no existe
  if (loginStyles?.card_background && !cssVariables['--org-card-background-rgb']) {
    const hexToRgb = (hex: string): string => {
      if (!hex || !hex.startsWith('#')) return '30, 41, 59';
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      if (!result) return '30, 41, 59';
      return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
    };
    cssVariables['--org-card-background-rgb'] = hexToRgb(loginStyles.card_background);
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden auth-page-enhanced transition-all duration-300"
      style={{
        ...backgroundStyle,
        ...cssVariables
      } as React.CSSProperties}
    >
      {/* Efectos de Gradiente con Colores de la Organización */}
      {!loginStyles?.background_type && (
        <div 
          className="absolute inset-0 z-0"
          style={{
            background: `radial-gradient(circle at 30% 50%, ${finalPrimaryColor}15, transparent 50%), radial-gradient(circle at 70% 50%, ${finalSecondaryColor}15, transparent 50%)`
          }}
        />
      )}

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
        
        <div 
          className="relative backdrop-blur-2xl p-8 lg:p-12 xl:p-20 shadow-2xl"
          style={{
            backgroundColor: loginStyles?.card_background || 'rgba(30, 41, 59, 0.95)',
            borderRadius: '24px',
            border: `2px solid ${loginStyles?.border_color || '#334155'}`
          }}
        >
          {/* Favicon con Animación - Solo mostrar cuando NO está cargando */}
          {!isLoading && (
            <motion.div
              className="flex flex-col items-center gap-6 mb-10"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.7, ease: 'easeOut' }}
            >
              <motion.div
                className="w-24 h-24 rounded-2xl overflow-hidden shadow-lg bg-gray-100/50 dark:bg-transparent"
                whileHover={{ scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <Image
                  src={faviconUrl}
                  alt={`${organization.name} Favicon`}
                  width={96}
                  height={96}
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
                    color: finalPrimaryColor
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
          )}

          {/* Estados de Carga y Error */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-10 gap-6">
              {/* Favicon/Logo con animación */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-20 h-20"
              >
                <Image
                  src={faviconUrl}
                  alt={`${organization.name} Logo`}
                  width={80}
                  height={80}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/icono.png';
                  }}
                />
              </motion.div>
              
              {/* Texto de carga con color de la organización */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-lg font-medium"
                style={{
                  color: finalPrimaryColor,
                  fontFamily: organization.brand_font_family || undefined
                }}
              >
                Cargando...
              </motion.p>
              
              {/* Spinner con color de la organización */}
              <div 
                className="w-12 h-12 border-4 rounded-full animate-spin"
                style={{
                  borderColor: `${finalPrimaryColor}30`,
                  borderTopColor: finalPrimaryColor
                }}
              ></div>
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

