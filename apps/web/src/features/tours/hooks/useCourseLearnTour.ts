'use client';

import { useState, useCallback, useEffect } from 'react';
import { CallBackProps, EVENTS, STATUS, ACTIONS } from 'react-joyride';
import { useTourProgress } from './useTourProgress';
import { COURSE_LEARN_TOUR_ID, courseLearnJoyrideSteps } from '../config/course-learn-joyride-steps';
import { JoyrideTooltip } from '../components/JoyrideTooltip';

interface UseCourseLearnTourOptions {
  enabled?: boolean;
  onOpenLia?: () => void;
  onCloseLia?: () => void;
  onOpenNotes?: (shouldScroll?: boolean) => void;
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

  const { 
    hasSeenTour,
    shouldShowTour,
    isLoading, 
    completeTour, 
    skipTour 
  } = useTourProgress(COURSE_LEARN_TOUR_ID);

  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  // Check if tour should run when data is loaded
  useEffect(() => {
    if (!enabled) return;
    
    if (!isLoading && !hasSeenTour && shouldShowTour) {
      // Delay to ensure UI is ready (video player, tabs, etc.)
      const timer = setTimeout(() => {
        setRun(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [enabled, isLoading, hasSeenTour, shouldShowTour]);


  const handleJoyrideCallback = useCallback(async (data: CallBackProps) => {
    const { action, index, status, type, step } = data;

    // Handle controlled navigation
    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
        if (action === ACTIONS.NEXT) {
            setStepIndex(index + 1);
        } else if (action === ACTIONS.PREV) {
            setStepIndex(index - 1);
        }
    }
    
    // UI Interactions logic BEFORE showing each step
    if (type === EVENTS.STEP_BEFORE) {
        // Tab Switching via callback
        if (step.data?.tabId) {
            const tabMap: Record<string, 'video' | 'transcript' | 'summary' | 'activities' | 'questions'> = {
              'tour-tab-video': 'video',
              'tour-tab-transcript': 'transcript',
              'tour-tab-summary': 'summary',
              'tour-tab-activities': 'activities',
              'tour-tab-questions': 'questions',
            };
            const tabName = tabMap[step.data.tabId];
            if (tabName && onSwitchTab) {
                onSwitchTab(tabName);
            }
        }

        // LIA Panel Interaction
        if (step.data?.liaAction === 'open' && onOpenLia) {
            onOpenLia();
        }

        // Notes Section
        if (step.data?.notesAction === 'open' && onOpenNotes) {
            onOpenNotes(true);
        }
    }

    if (status === STATUS.FINISHED) {
      setRun(false);
      setStepIndex(0);
      await completeTour();
      // Cleanup
      onCloseLia?.();
      onCloseNotes?.();
      onSwitchTab?.('video');
    }

    if (status === STATUS.SKIPPED) {
      setRun(false);
      setStepIndex(0);
      await skipTour();
      // Cleanup
      onCloseLia?.();
      onCloseNotes?.();
      onSwitchTab?.('video');
    }
  }, [completeTour, skipTour, onOpenLia, onCloseLia, onOpenNotes, onCloseNotes, onSwitchTab]);

  const restartTour = useCallback(() => {
    setRun(false);
    setStepIndex(0);
    // Force restart with timeout
    setTimeout(() => {
        setRun(true);
    }, 100);
  }, []);

  const joyrideProps = {
    run,
    steps: courseLearnJoyrideSteps,
    stepIndex,
    continuous: true,
    scrollToFirstStep: true,
    showProgress: true,
    showSkipButton: true,
    spotlightClicks: true,
    spotlightPadding: 10,
    disableOverlayClose: true,
    tooltipComponent: JoyrideTooltip,
    callback: handleJoyrideCallback,
    floaterProps: {
      disableAnimation: false,
      hideArrow: false,
      offset: 15,
      styles: {
        floater: {
          filter: 'drop-shadow(0 4px 20px rgba(0, 0, 0, 0.3))',
        },
      },
    },
    styles: {
      options: {
        zIndex: 10000,
        primaryColor: '#00D4B3',
        overlayColor: 'rgba(0, 0, 0, 0.75)',
      },
      spotlight: {
        borderRadius: 12,
      },
      overlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
      },
    },
    locale: {
      back: 'Anterior',
      close: 'Cerrar',
      last: 'Finalizar',
      next: 'Siguiente',
      skip: 'Saltar',
    },
  };

  return {
    shouldShowTour: run,
    isLoading,
    currentStep: stepIndex,
    handleComplete: completeTour,
    handleSkip: skipTour,
    resetTour: restartTour,
    startTour: restartTour,
    joyrideProps,
    restartTour
  };
}
