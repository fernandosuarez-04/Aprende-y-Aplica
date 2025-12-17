'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface LiaPanelContextType {
  isPanelOpen: boolean;
  setIsPanelOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  panelWidth: number;
}

const LiaPanelContext = createContext<LiaPanelContextType | undefined>(undefined);

export function LiaPanelProvider({ children }: { children: ReactNode }) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  // Ancho del panel cuando está expandido (en píxeles)
  // max-w-md = 448px, pero en móvil es w-[90vw]
  // Usamos 448px como máximo para el desplazamiento del contenido
  const panelWidth = 448; // max-w-md = 448px

  return (
    <LiaPanelContext.Provider
      value={{
        isPanelOpen,
        setIsPanelOpen,
        isCollapsed,
        setIsCollapsed,
        panelWidth,
      }}
    >
      {children}
    </LiaPanelContext.Provider>
  );
}

export function useLiaPanel() {
  const context = useContext(LiaPanelContext);
  if (context === undefined) {
    throw new Error('useLiaPanel must be used within a LiaPanelProvider');
  }
  return context;
}

