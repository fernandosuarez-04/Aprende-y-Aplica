'use client';

import { useEffect, useRef } from 'react';
import { useNextStep } from 'nextstepjs';
import { useTourProgress } from './useTourProgress';
import { DASHBOARD_TOUR_ID } from '../config/dashboard-tour-steps';

interface UseDashboardTourOptions {
  enabled?: boolean;
}

/**
 * Hook para manejar el tour automático del dashboard
 * Se inicia automáticamente si es la primera vez que el usuario visita el dashboard
 */
export function useDashboardTour(options: UseDashboardTourOptions = {}) {
  const { enabled = true } = options;
  const { startNextStep, closeNextStep } = useNextStep();
  const { shouldShowTour, isLoading, startTour, completeTour, skipTour, updateStep } = useTourProgress(DASHBOARD_TOUR_ID);
  const hasStartedRef = useRef(false);

  // Iniciar tour automáticamente si es la primera visita
  useEffect(() => {
    console.log('🔍 [useDashboardTour] State:', { 
      enabled, 
      isLoading, 
      shouldShowTour, 
      hasStarted: hasStartedRef.current,
      tourId: DASHBOARD_TOUR_ID 
    });

    if (!enabled || isLoading || hasStartedRef.current) return;

    if (shouldShowTour) {
      console.log('🚀 [useDashboardTour] Condition met! Preparing to start...');
      
      const timer = setTimeout(() => {
        console.log('✨ [useDashboardTour] Executing start sequence now!');
        
        // 1. Marcar como iniciado localmente
        hasStartedRef.current = true;
        
        // 2. Iniciar tracking en BD (POST)
        startTour().then(() => {
          console.log('📝 [useDashboardTour] DB start recorded');
        }).catch(err => console.error('❌ [useDashboardTour] DB start failed', err));

        // 3. Iniciar UI del tour
        try {
          console.log('🎨 [useDashboardTour] Calling startNextStep...');
          startNextStep(DASHBOARD_TOUR_ID);
        } catch (error) {
          console.error('❌ [useDashboardTour] Error parsing/starting nextstep:', error);
        }

      }, 2000); // 2 segundos delay

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
    startNextStep(DASHBOARD_TOUR_ID);
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
