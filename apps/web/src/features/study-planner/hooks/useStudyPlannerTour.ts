'use client';

import { useEffect, useRef } from 'react';
import { useNextStep } from 'nextstepjs';
import { useTourProgress } from '@/features/tours/hooks/useTourProgress';
import { studyPlannerTourSteps } from '@/features/tours/config/study-planner-tour-steps';

export function useStudyPlannerTour() {
  const { startNextStep, closeNextStep } = useNextStep();
  const { shouldShowTour, isLoading, startTour, completeTour, skipTour, updateStep } = useTourProgress('study-planner-tour');
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (isLoading || hasStartedRef.current) return;

    if (shouldShowTour) {
      const timer = setTimeout(() => {
        hasStartedRef.current = true;
        startTour();
        startNextStep('study-planner-tour');
      }, 1000);

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
    startNextStep('study-planner-tour');
  };

  return {
    restartTour,
    isLoading,
  };
}
