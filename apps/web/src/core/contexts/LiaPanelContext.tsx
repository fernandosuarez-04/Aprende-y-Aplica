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
  // Reducido a 360px para un diseño más compacto
  const panelWidth = 360; // Previously 448px (max-w-md)

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

