'use client';

import React, { useEffect, useState } from 'react';
import { useLiaPanel } from '../../contexts/LiaPanelContext';

export function ContentWrapper({ children }: { children: React.ReactNode }) {
  const { isPanelOpen, isCollapsed } = useLiaPanel();
  const [panelWidth, setPanelWidth] = useState(448); // max-w-md = 448px por defecto
  
  // Calcular el ancho del panel según el tamaño de pantalla
  useEffect(() => {
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
  
  return (
    <div 
      className="bg-[var(--color-bg-dark)] transition-colors duration-300 min-h-full transition-all duration-300 ease-in-out"
      style={{
        marginRight: isPanelOpen && !isCollapsed ? `${panelWidth}px` : '0',
      }}
    >
      {children}
    </div>
  );
}

