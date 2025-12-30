'use client';

import { useEffect, useRef } from 'react';
import { useNextStep } from 'nextstepjs';
import { useTourProgress } from '@/features/tours/hooks/useTourProgress';

export function useStudyPlannerDashboardTour() {
  const { startNextStep, closeNextStep } = useNextStep();
  const { shouldShowTour, isLoading, startTour, completeTour, skipTour, updateStep } = useTourProgress('study-planner-dashboard-tour');
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (isLoading || hasStartedRef.current) return;

    if (shouldShowTour) {
      const timer = setTimeout(() => {
        hasStartedRef.current = true;
        startTour();
        // Give a bit more time for valid rendering of large components like calendar
        startNextStep('study-planner-dashboard-tour');
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [isLoading, shouldShowTour, startTour, startNextStep]);

  const handleTourComplete = async () => {
    await completeTour();
    closeNextStep();
  };

  const handleTourSkip = async () => {
    await skipTour();
    closeNextStep();
  };

  const restartTour = () => {
    hasStartedRef.current = true;
    startNextStep('study-planner-dashboard-tour');
  };

  return {
    restartTour,
    isLoading,
    shouldShowTour
  };
}
