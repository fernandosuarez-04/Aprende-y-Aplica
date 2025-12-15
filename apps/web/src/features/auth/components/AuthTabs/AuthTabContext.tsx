'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { AuthTab } from '../../types/auth.types';

interface AuthTabContextType {
  activeTab: AuthTab;
  setActiveTab: (tab: AuthTab) => void;
}

const AuthTabContext = createContext<AuthTabContextType | undefined>(undefined);

export function AuthTabProvider({ 
  children,
  initialTab 
}: { 
  children: React.ReactNode;
  initialTab?: AuthTab;
}) {
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get('tab');
  
  const [activeTab, setActiveTabState] = useState<AuthTab>(
    initialTab || (tabParam === 'register' ? 'register' : 'login')
  );

  // Sincronizar con URL cuando cambia
  useEffect(() => {
    if (tabParam === 'register') {
      setActiveTabState('register');
    } else if (tabParam === 'login' || !tabParam) {
      setActiveTabState('login');
    }
  }, [tabParam]);

  const setActiveTab = (tab: AuthTab) => {
    setActiveTabState(tab);
    // Actualizar URL sin recargar usando window.history
    const newUrl = tab === 'register' ? '/auth?tab=register' : '/auth';
    window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, '', newUrl);
  };

  return (
    <AuthTabContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </AuthTabContext.Provider>
  );
}

export function useAuthTab() {
  const context = useContext(AuthTabContext);
  if (context === undefined) {
    throw new Error('useAuthTab must be used within an AuthTabProvider');
  }
  return context;
}

