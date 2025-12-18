'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { getBackgroundStyle, generateCSSVariables, hexToRgb } from '../../../business-panel/utils/styles';
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
      className="min-h-screen flex items-center justify-center relative overflow-hidden transition-all duration-500"
      style={{
        ...backgroundStyle,
        ...cssVariables
      } as React.CSSProperties}
    >
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
          </motion.div>
        </>
      )}

      {/* Two-Column Layout Container */}
      <div className="w-full h-screen flex items-center justify-center p-4 lg:p-8 relative z-10">
        <div className="w-full max-w-7xl h-full max-h-[600px] flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12">
          
          {/* LEFT SIDE - 3D Floating Logo */}
          {!isLoading && (
            <motion.div
              className="flex-1 flex items-center justify-center relative"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Floating Animation Container */}
              <motion.div
                className="relative"
                animate={{
                  y: [-15, 15, -15],
                  rotateY: [0, 10, 0, -10, 0],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                {/* 3D Logo Container - No Rings */}
                <div className="relative w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] lg:w-[360px] lg:h-[360px]">

                  {/* Logo/Favicon - Center */}
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    whileHover={{ scale: 1.1, rotate: 8 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <div 
                      className="relative w-40 h-40 sm:w-48 sm:h-48 lg:w-56 lg:h-56 rounded-3xl overflow-hidden shadow-2xl"
                      style={{
                        boxShadow: `0 30px 60px -15px ${finalPrimaryColor}70, 0 0 40px ${finalSecondaryColor}50`,
                      }}
                    >
                      <Image
                        src={faviconUrl}
                        alt={`${organization.name} Logo`}
                        fill
                        className="object-cover"
                        sizes="224px"
                        style={{
                          objectFit: 'cover',
                          objectPosition: 'center',
                        }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/icono.png';
                        }}
                        priority
                      />
                    </div>
                  </motion.div>

                  {/* Pulsing Glow Effect */}
                  <motion.div
                    className="absolute inset-0 rounded-full pointer-events-none"
                    style={{
                      background: `radial-gradient(circle, ${finalPrimaryColor}50, transparent 70%)`,
                    }}
                    animate={{
                      scale: [1, 1.4, 1],
                      opacity: [0.4, 0.7, 0.4],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: 0.5,
                    }}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* RIGHT SIDE - Login Form Panel */}
          <motion.div
            className="flex-1 w-full max-w-md lg:max-w-lg"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          >
            {/* Login Card */}
            <div 
              className="relative backdrop-blur-2xl p-8 lg:p-10 shadow-2xl rounded-3xl border overflow-hidden"
              style={{
                backgroundColor: cardBackgroundColor,
                borderColor: borderColor,
                boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px ${borderColor}20`,
              }}
            >
              {/* Inner gradient overlay */}
              <motion.div 
                className="absolute inset-0 opacity-10 rounded-3xl pointer-events-none"
                style={{
                  background: `linear-gradient(135deg, ${finalPrimaryColor}20, transparent, ${finalSecondaryColor}20)`,
                }}
              />

              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  background: `linear-gradient(135deg, transparent 30%, ${finalPrimaryColor}30 50%, transparent 70%)`,
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
                {/* Organization Info */}
                {!isLoading && (
                  <motion.div
                    className="text-center mb-8"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                  >
                    <motion.h1 
                      className="text-3xl lg:text-4xl font-bold mb-2"
                      style={{
                        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
                        color: finalPrimaryColor,
                        textShadow: `0 0 20px ${finalPrimaryColor}30`,
                      }}
                    >
                      {organization.name}
                    </motion.h1>
                    {organization.description && (
                      <motion.p 
                        className="text-sm opacity-70"
                        style={{ color: textColor }}
                      >
                        {organization.description}
                      </motion.p>
                    )}
                  </motion.div>
                )}

                {/* Loading State - Hidden */}
                {isLoading && null}

                {/* Error State */}
                {error && !isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 rounded-2xl bg-red-500/20 border border-red-500/50"
                  >
                    <p className="text-red-400 text-sm text-center">{error}</p>
                  </motion.div>
                )}

                {/* Form Content */}
                {!isLoading && !error && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                  >
                    {children}
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
