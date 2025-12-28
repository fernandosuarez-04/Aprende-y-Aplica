'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useLiaPanel } from '../../contexts/LiaPanelContext';

export function ContentWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Obtener estado del panel de LIA (con fallback si no está en el contexto)
  let isPanelOpen = false;
  try {
    const liaPanel = useLiaPanel();
    isPanelOpen = liaPanel.isOpen;
  } catch {
    // Si no está dentro del LiaPanelProvider, ignorar
  }

  // Detectar si estamos en rutas que tienen su propio sistema de temas
  const isCustomThemedRoute = pathname?.startsWith('/business-panel') || pathname?.startsWith('/business-user');
  
  // Detectar si estamos en rutas que manejan su propio layout (admin tiene su propio sistema)
  const isAdminRoute = pathname?.startsWith('/admin');

  // Estado para controlar la hidratación y evitar mismatch
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Si es una ruta con tema personalizado (business-panel, business-user),
  // no aplicar fondo para evitar conflictos con el tema de la organización
  const bgClass = isCustomThemedRoute ? '' : 'bg-[var(--color-bg-dark)]';

  return (
    <div
      className={`${bgClass} min-h-full transition-all duration-300 ease-in-out`}
      style={{ 
        // Solo aplicar paddingRight si el panel está abierto Y no estamos en admin Y no estamos en rutas con tema personalizado
        // Usamos 'mounted' para asegurar que coincida con el servidor (siempre cerrado inicialmente)
        paddingRight: mounted && isPanelOpen && !isAdminRoute && !isCustomThemedRoute ? '420px' : '0px' 
      }}
      suppressHydrationWarning
    >
      {children}
    </div>
  );
}

