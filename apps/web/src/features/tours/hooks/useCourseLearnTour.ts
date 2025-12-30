'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useNextStep } from 'nextstepjs';
import { useTourProgress } from './useTourProgress';
import { COURSE_LEARN_TOUR_ID } from '../config/course-learn-tour-steps';

interface UseCourseLearnTourOptions {
  enabled?: boolean;
  // Callbacks for interactive actions
  onOpenLia?: () => void;
  onCloseLia?: () => void;
  onOpenNotes?: () => void;
  onCloseNotes?: () => void;
  onSwitchTab?: (tab: 'video' | 'transcript' | 'summary' | 'activities' | 'questions') => void;
}

export function useCourseLearnTour(options: UseCourseLearnTourOptions = {}) {
  const { 
    enabled = true,
    onOpenLia,
    onCloseLia,
    onOpenNotes,
    onCloseNotes,
    onSwitchTab
  } = options;
  
  const { startNextStep, closeNextStep, currentStep } = useNextStep();
  const { shouldShowTour, isLoading, startTour, completeTour, skipTour } = useTourProgress(COURSE_LEARN_TOUR_ID);
  
  const hasStartedRef = useRef(false);

  // Effect to trigger interactive actions based on current step
  useEffect(() => {
    if (currentStep === undefined || currentStep === null) return;

    // Execute actions based on tour step
    switch (currentStep) {
      case 3: // Transcription tab
        onSwitchTab?.('transcript');
        break;
      case 4: // Summary tab
        onSwitchTab?.('summary');
        break;
      case 5: // Activities tab
        onSwitchTab?.('activities');
        break;
      case 6: // Questions tab  
        onSwitchTab?.('questions');
        break;
      case 7: // Notes button - open notes modal
        onOpenNotes?.();
        break;
      case 8: // LIA button - prepare to show LIA
        onCloseNotes?.();
        break;
      case 9: // LIA panel - open LIA
        onOpenLia?.();
        break;
      case 10: // Wrap up - close everything
        onSwitchTab?.('video');
        break;
    }
  }, [currentStep, onOpenLia, onCloseLia, onOpenNotes, onCloseNotes, onSwitchTab]);

  // Auto-start tour when conditions are met
  useEffect(() => {
    if (!enabled || isLoading || !shouldShowTour || hasStartedRef.current) {
      return;
    }

    // Wait for the page to render
    const timer = setTimeout(() => {
      hasStartedRef.current = true;
      
      // Record start in DB
      startTour().catch(err => console.error('[useCourseLearnTour] DB start failed', err));

      // Start the UI tour
      try {
        startNextStep(COURSE_LEARN_TOUR_ID);
      } catch (error) {
        console.error('[useCourseLearnTour] Error starting tour:', error);
      }
    }, 2000); // Slightly longer delay to ensure video player loads

    return () => clearTimeout(timer);
  }, [enabled, isLoading, shouldShowTour, startTour, startNextStep]);

  // Handler for tour completion
  const handleComplete = useCallback(async () => {
    await completeTour();
    onCloseLia?.();
    onCloseNotes?.();
    onSwitchTab?.('video');
  }, [completeTour, onCloseLia, onCloseNotes, onSwitchTab]);

  // Handler for skipping tour
  const handleSkip = useCallback(async () => {
    await skipTour();
    onCloseLia?.();
    onCloseNotes?.();
    onSwitchTab?.('video');
  }, [skipTour, onCloseLia, onCloseNotes, onSwitchTab]);

  // Reset tour (for testing)
  const resetTour = useCallback(() => {
    hasStartedRef.current = false;
  }, []);

  return {
    shouldShowTour,
    isLoading,
    currentStep,
    handleComplete,
    handleSkip,
    resetTour,
    startTour: () => {
      hasStartedRef.current = true;
      startNextStep(COURSE_LEARN_TOUR_ID);
    }
  };
}
