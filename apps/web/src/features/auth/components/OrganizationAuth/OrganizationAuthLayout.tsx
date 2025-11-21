'use client';

import React, { useEffect, useState, Suspense, lazy } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { getBackgroundStyle, generateCSSVariables, hexToRgb } from '../../../business-panel/utils/styles';
import type { StyleConfig } from '../../../business-panel/hooks/useOrganizationStyles';

// Lazy load particles background
const ParticlesBackground = lazy(() => 
  import('@/app/business-user/dashboard/components/ParticlesBackground').then(m => ({ default: m.ParticlesBackground }))
);

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
  
  // Calcular estilos de la tarjeta
  const cardBackground = loginStyles?.card_background || '#1a1a2e';
  const cardOpacity = loginStyles?.card_opacity !== undefined ? loginStyles.card_opacity : 0.95;
  const borderColor = loginStyles?.border_color || 'rgba(71, 85, 105, 0.3)';
  const textColor = loginStyles?.text_color || '#ffffff';

  let cardBackgroundColor: string;
  if (cardBackground.startsWith('#')) {
    const rgb = hexToRgb(cardBackground);
    cardBackgroundColor = `rgba(${rgb}, ${cardOpacity})`;
  } else if (cardBackground.startsWith('rgba')) {
    const rgbaMatch = cardBackground.match(/rgba?\(([^)]+)\)/);
    if (rgbaMatch) {
      const parts = rgbaMatch[1].split(',');
      if (parts.length >= 3) {
        cardBackgroundColor = `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${cardOpacity})`;
      } else {
        cardBackgroundColor = cardBackground;
      }
    } else {
      cardBackgroundColor = cardBackground;
    }
  } else {
    cardBackgroundColor = cardBackground;
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden transition-all duration-500"
      style={{
        ...backgroundStyle,
        ...cssVariables
      } as React.CSSProperties}
    >
      {/* Particles Background - Lazy loaded */}
      <Suspense fallback={null}>
        <ParticlesBackground />
      </Suspense>

      {/* Animated Gradient Orbs */}
      {!loginStyles?.background_type && (
        <>
          <motion.div
            className="absolute inset-0 z-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            {/* Large gradient orbs */}
            <motion.div
              className="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl opacity-20"
              style={{
                background: `radial-gradient(circle, ${finalPrimaryColor}, transparent)`,
              }}
              animate={{
                x: [0, 100, 0],
                y: [0, 50, 0],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <motion.div
              className="absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-20"
              style={{
                background: `radial-gradient(circle, ${finalSecondaryColor}, transparent)`,
              }}
              animate={{
                x: [0, -100, 0],
                y: [0, -50, 0],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 25,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 1,
              }}
            />
            <motion.div
              className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full blur-2xl opacity-15"
              style={{
                background: `radial-gradient(circle, ${finalPrimaryColor}40, transparent)`,
              }}
              animate={{
                x: ['-50%', '-45%', '-50%'],
                y: ['-50%', '-55%', '-50%'],
                scale: [1, 1.3, 1],
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 0.5,
              }}
            />
          </motion.div>

          {/* Animated grid pattern */}
          <motion.div
            className="absolute inset-0 z-0 opacity-5"
            style={{
              backgroundImage: `
                linear-gradient(0deg, transparent 24%, ${finalPrimaryColor}15 25%, ${finalPrimaryColor}15 26%, transparent 27%, transparent 74%, ${finalSecondaryColor}15 75%, ${finalSecondaryColor}15 76%, transparent 77%, transparent),
                linear-gradient(90deg, transparent 24%, ${finalPrimaryColor}15 25%, ${finalPrimaryColor}15 26%, transparent 27%, transparent 74%, ${finalSecondaryColor}15 75%, ${finalSecondaryColor}15 76%, transparent 77%, transparent)
              `,
              backgroundSize: '50px 50px',
            }}
            animate={{
              backgroundPosition: ['0% 0%', '50px 50px'],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        </>
      )}

      {/* Main Card with Modern Design */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md lg:max-w-lg xl:max-w-xl relative z-10"
      >
        {/* Outer Glow Effect */}
        <motion.div
          className="absolute -inset-1 rounded-3xl opacity-50 blur-2xl"
          style={{
            background: `linear-gradient(135deg, ${finalPrimaryColor}40, ${finalSecondaryColor}40, ${finalPrimaryColor}40)`,
          }}
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.02, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Main Card Container */}
        <div 
          className="relative backdrop-blur-2xl p-8 lg:p-10 xl:p-12 shadow-2xl rounded-3xl border overflow-hidden"
          style={{
            backgroundColor: cardBackgroundColor,
            borderColor: borderColor,
            boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px ${borderColor}20`,
          }}
        >
          {/* Inner gradient overlay */}
          <div 
            className="absolute inset-0 opacity-10 rounded-3xl pointer-events-none"
            style={{
              background: `linear-gradient(135deg, ${finalPrimaryColor}20, transparent, ${finalSecondaryColor}20)`,
            }}
          />

          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              background: `linear-gradient(135deg, transparent 30%, ${finalPrimaryColor}20 50%, transparent 70%)`,
            }}
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear',
            }}
          />

          {/* Content */}
          <div className="relative z-10">
            {/* Logo Section */}
            {!isLoading && (
              <motion.div
                className="flex flex-col items-center gap-6 mb-10"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              >
                <motion.div
                  className="relative w-24 h-24 rounded-2xl overflow-hidden shadow-2xl"
                  style={{
                    boxShadow: `0 20px 40px -12px ${finalPrimaryColor}40`,
                  }}
                  whileHover={{ scale: 1.05, rotate: 2 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <Image
                    src={faviconUrl}
                    alt={`${organization.name} Logo`}
                    fill
                    className="object-cover"
                    sizes="96px"
                    style={{
                      objectFit: 'cover',
                      objectPosition: 'center',
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/icono.png';
                    }}
                  />
                </motion.div>
                
                <div className="text-center space-y-3">
                  <motion.h1 
                    className="text-3xl lg:text-4xl font-bold"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                      fontFamily: organization.brand_font_family || undefined,
                      color: finalPrimaryColor,
                      textShadow: `0 0 20px ${finalPrimaryColor}30`,
                    }}
                  >
                    {organization.name}
                  </motion.h1>
                  {organization.description && (
                    <motion.p 
                      className="text-sm lg:text-base opacity-80 leading-relaxed"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.8 }}
                      transition={{ delay: 0.6, duration: 0.5 }}
                      style={{ color: textColor }}
                    >
                      {organization.description}
                    </motion.p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Loading State */}
            {isLoading && (
              <motion.div
                className="flex flex-col items-center justify-center py-16 gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <motion.div
                  className="relative w-20 h-20"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5 }}
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
                  <motion.div
                    className="absolute inset-0 border-4 rounded-full"
                    style={{
                      borderColor: `${finalPrimaryColor}30`,
                      borderTopColor: finalPrimaryColor,
                    }}
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  />
                </motion.div>
                
                <motion.p
                  className="text-lg font-medium"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  style={{
                    color: finalPrimaryColor,
                    fontFamily: organization.brand_font_family || undefined,
                  }}
                >
                  Cargando...
                </motion.p>
              </motion.div>
            )}

            {/* Error State */}
            {error && !isLoading && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 rounded-2xl bg-red-500/20 border border-red-500/50 backdrop-blur-sm"
              >
                <p className="text-red-400 text-sm text-center">{error}</p>
              </motion.div>
            )}

            {/* Main Content */}
            {!isLoading && !error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              >
                {children}
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
