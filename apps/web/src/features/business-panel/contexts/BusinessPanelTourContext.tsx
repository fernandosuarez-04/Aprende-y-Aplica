'use client';

import React, { createContext, useContext } from 'react';

interface BusinessPanelTourContextType {
  startTour: () => void;
  resetTour: () => void;
  isRunning: boolean;
}

const BusinessPanelTourContext = createContext<BusinessPanelTourContextType | null>(null);

export function BusinessPanelTourProvider({ 
  children, 
  startTour, 
  resetTour,
  isRunning 
}: { 
  children: React.ReactNode;
  startTour: () => void;
  resetTour: () => void;
  isRunning: boolean;
}) {
  return (
    <BusinessPanelTourContext.Provider value={{ startTour, resetTour, isRunning }}>
      {children}
    </BusinessPanelTourContext.Provider>
  );
}

export function useBusinessPanelTour() {
  const context = useContext(BusinessPanelTourContext);
  if (!context) {
    throw new Error('useBusinessPanelTour must be used within a BusinessPanelTourProvider');
  }
  return context;
}

// Hook opcional que no lanza error si no está dentro del provider
export function useBusinessPanelTourOptional() {
  return useContext(BusinessPanelTourContext);
}
