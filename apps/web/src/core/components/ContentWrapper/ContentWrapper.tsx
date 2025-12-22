'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useLiaPanel } from '../../contexts/LiaPanelContext';

export function ContentWrapper({ children }: { children: React.ReactNode }) {
  const { isPanelOpen, isCollapsed } = useLiaPanel();
  const pathname = usePathname();
  // Inicializar con 0 para evitar mismatch de hidratación
  // El valor real se calculará en useEffect después del montaje
  const [panelWidth, setPanelWidth] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  // Detectar si estamos en rutas que tienen su propio sistema de temas
  const isCustomThemedRoute = pathname?.startsWith('/business-panel') || pathname?.startsWith('/business-user');

  // Detectar si estamos en rutas que manejan su propio layout de margen para LIA
  // Estas rutas controlan el margen del contenido internamente para mantener el navbar fijo
  const handlesOwnLiaLayout = pathname?.startsWith('/business-user');

  // Calcular el ancho del panel según el tamaño de pantalla
  useEffect(() => {
    setIsMounted(true);

    const calculatePanelWidth = () => {
      if (typeof window === 'undefined') return;

      const width = window.innerWidth;
      // Móvil: w-[90vw] = 90% del viewport
      if (width < 640) { // sm breakpoint
        setPanelWidth(width * 0.9);
      }
      // Desktop pequeño: w-96 = 384px
      else if (width < 768) {
        setPanelWidth(384);
      }
      // Desktop: max-w-md = 448px
      else {
        setPanelWidth(448);
      }
    };

    calculatePanelWidth();
    window.addEventListener('resize', calculatePanelWidth);

    return () => window.removeEventListener('resize', calculatePanelWidth);
  }, []);

  // Si es una ruta con tema personalizado (business-panel, business-user),
  // no aplicar fondo para evitar conflictos con el tema de la organización
  const bgClass = isCustomThemedRoute ? '' : 'bg-[var(--color-bg-dark)]';

  // Si la ruta maneja su propio layout de LIA, no aplicar marginRight aquí
  // para evitar que el navbar se desplace
  // Solo aplicar margen después de que el componente esté montado para evitar hidratación
  const shouldApplyMargin = isMounted && !handlesOwnLiaLayout && isPanelOpen && !isCollapsed;

  return (
    <div
      className={`${bgClass} min-h-full transition-all duration-300 ease-in-out`}
      style={{
        marginRight: shouldApplyMargin ? `${panelWidth}px` : '0',
      }}
      suppressHydrationWarning
    >
      {children}
    </div>
  );
}
