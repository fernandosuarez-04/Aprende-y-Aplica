'use client';

import { useEffect, useRef } from 'react';
import { useNextStep } from 'nextstepjs';
import { useTourProgress } from './useTourProgress';
import { BUSINESS_PANEL_TOUR_ID } from '../config/business-panel-tour-steps';

interface UseDashboardTourOptions {
  enabled?: boolean;
}

/**
 * Hook para manejar el tour automático del panel de gestión (Business Admin)
 * Se inicia automáticamente si es la primera vez que el administrador visita el dashboard
 */
export function useBusinessPanelTour(options: UseDashboardTourOptions = {}) {
  const { enabled = true } = options;
  const { startNextStep, closeNextStep } = useNextStep();
  const { shouldShowTour, isLoading, startTour, completeTour, skipTour, updateStep } = useTourProgress(BUSINESS_PANEL_TOUR_ID);
  const hasStartedRef = useRef(false);

  // Iniciar tour automáticamente si es la primera visita
  useEffect(() => {
    // console.log('🔍 [useBusinessPanelTour] State:', { 
    //   enabled, 
    //   isLoading, 
    //   shouldShowTour, 
    //   hasStarted: hasStartedRef.current 
    // });

    if (!enabled || isLoading || hasStartedRef.current) return;

    if (shouldShowTour) {
      // console.log('🚀 [useBusinessPanelTour] Condition met! Preparing to start...');
      
      const timer = setTimeout(() => {
        // console.log('✨ [useBusinessPanelTour] Executing start sequence now!');
        
        // 0. Asegurar que el contenedor está en el top para evitar scroll innecesario
        const mainContainer = document.getElementById('main-scroll-container');
        if (mainContainer) {
          mainContainer.scrollTop = 0;
        }

        // 1. Marcar como iniciado localmente
        hasStartedRef.current = true;
        
        // 2. Iniciar tracking en BD (POST)
        startTour().then(() => {
          // console.log('📝 [useBusinessPanelTour] DB start recorded');
        }).catch(err => console.error('❌ [useBusinessPanelTour] DB start failed', err));

        // 3. Iniciar UI del tour
        try {
          startNextStep(BUSINESS_PANEL_TOUR_ID);
        } catch (error) {
          console.error('❌ [useBusinessPanelTour] Error starting nextstep:', error);
        }

      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [enabled, isLoading, shouldShowTour, startTour, startNextStep]);

  // Función para manejar cuando se completa el tour
  const handleTourComplete = async () => {
    await completeTour();
    closeNextStep();
  };

  // Función para manejar cuando se salta el tour
  const handleTourSkip = async () => {
    await skipTour();
    closeNextStep();
  };

  // Función para actualizar el paso actual
  const handleStepChange = (step: number) => {
    updateStep(step);
  };

  // Función para reiniciar el tour manualmente
  const restartTour = () => {
    hasStartedRef.current = true;
    startNextStep(BUSINESS_PANEL_TOUR_ID);
  };

  return {
    isLoading,
    shouldShowTour,
    handleTourComplete,
    handleTourSkip,
    handleStepChange,
    restartTour
  };
}
