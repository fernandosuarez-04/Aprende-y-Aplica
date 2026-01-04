import { useState, useCallback, useEffect } from 'react';
import { CallBackProps, EVENTS, STATUS, ACTIONS } from 'react-joyride';
import { useTourProgress } from './useTourProgress';
import { COURSE_LEARN_TOUR_ID, courseLearnJoyrideSteps } from '../config/course-learn-joyride-steps';
// import { useLiaPanel } from '@/core/contexts/LiaPanelContext'; // Omitir temporalmente si causa problemas de ciclo o si no estoy seguro del contexto
import { JoyrideTooltip } from '../components/JoyrideTooltip';

export const useCourseLearnJoyride = () => {
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
    if (!isLoading && !hasSeenTour && shouldShowTour) {
      // Small delay to ensure UI is ready
      const timer = setTimeout(() => {
        setRun(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, hasSeenTour, shouldShowTour]);

  const handleJoyrideCallback = useCallback(async (data: CallBackProps) => {
    const { action, index, status, type, step } = data;

    // Handle close button click
    if (action === ACTIONS.CLOSE) {
      setRun(false);
      setStepIndex(0);
      await skipTour();
      return;
    }

    // Handle skip button click
    if (action === ACTIONS.SKIP) {
      setRun(false);
      setStepIndex(0);
      await skipTour();
      return;
    }

    // Handle controlled navigation
    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
        if (action === ACTIONS.NEXT) {
            setStepIndex(index + 1);
        } else if (action === ACTIONS.PREV) {
            setStepIndex(index - 1);
        }
    }

    // UI Interactions logic (Tab switching y Panel opening)
    // Usamos STEP_BEFORE para preparar la UI antes de mostrar el paso
    if (type === EVENTS.STEP_BEFORE) {
        // Tab Switching
        if (step.data?.tabId) {
            const tabElement = document.getElementById(step.data.tabId);
            if (tabElement) {
                // Verificar si ya tiene aria-selected="true" o clase activa para no clickear en balde
                // Pero un click extra no daña
                tabElement.click();
            } else {
                console.warn(`[Tour] Tab element not found: ${step.data.tabId}`);
            }
        }

        // LIA Panel Interaction
        if (step.data?.liaAction === 'open') {
            const liaButton = document.getElementById('tour-lia-course-button');
            // Intentar abrir el panel simulando click si no tengo acceso al contexto directo aquí
            // (Es más seguro simular click que depender del contexto si el hook está aislado)
            if (liaButton) {
                liaButton.click();
            }
        }
    }

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRun(false);
      setStepIndex(0);
      await completeTour();
    }
  }, [completeTour, skipTour]);

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
    tooltipComponent: JoyrideTooltip,
    callback: handleJoyrideCallback,
    styles: {
      options: {
        zIndex: 10000,
        primaryColor: '#00D4B3',
        textColor: '#FFFFFF',
        backgroundColor: '#1E2329',
        arrowColor: '#1E2329',
      },
      overlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
      },
    },
    // Deshabilitar scrolling automático de Joyride si queremos controlar nosotros la vista,
    // pero generalmente ayuda.
    disableScrollParentFix: true, 
  };

  return { joyrideProps, restartTour };
};
