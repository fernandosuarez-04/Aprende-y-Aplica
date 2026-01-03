'use client';

import React, { useEffect, useRef, useState, createContext, useContext } from 'react';
import { NextStepProvider, NextStep, useNextStep } from 'nextstepjs';
import { courselearnTourSteps } from '../config/course-learn-tour-steps';
import { useTourProgress } from '../hooks/useTourProgress';
import { GlobalTourCard } from './GlobalTourCard';
import { COURSE_LEARN_TOUR_ID } from '../config/course-learn-tour-steps';

interface CourseLearnTourWrapperProps {
  children: React.ReactNode;
  // Actions to control course learning page
  onOpenLia?: () => void;
  onCloseLia?: () => void;
  onSwitchTab?: (tab: 'video' | 'transcript' | 'summary' | 'activities' | 'questions') => void;
}

// Contexto para compartir el paso actual del tour
const TourStepContext = createContext<{ currentStep: number | null }>({ currentStep: null });

export const useTourStep = () => useContext(TourStepContext);

function CourseLearnTourContent({ 
  children,
  onOpenLia,
  onCloseLia,
  onSwitchTab
}: CourseLearnTourWrapperProps) {
  const { startNextStep, closeNextStep } = useNextStep();
  const { shouldShowTour, isLoading, startTour, completeTour, skipTour } = useTourProgress(COURSE_LEARN_TOUR_ID);
  const hasStartedRef = useRef(false);
  const [currentStep, setCurrentStep] = useState<number | null>(null);
  const previousStepRef = useRef<number | null>(null);

  // Efecto para ajustar z-index del modal del tour cuando el panel de LIA está abierto
  useEffect(() => {
    const adjustTourModalZIndex = () => {
      const liaPanel = document.getElementById('tour-lia-panel');
      const tourModals = document.querySelectorAll('div[style*="position: fixed"]:has(div[class*="rounded-2xl"])');
      
      if (liaPanel && tourModals.length > 0) {
        tourModals.forEach((modal) => {
          const modalElement = modal as HTMLElement;
          // Asegurar que el modal tenga z-index muy alto cuando el panel está visible
          if (modalElement.style.zIndex) {
            const currentZIndex = parseInt(modalElement.style.zIndex) || 0;
            if (currentZIndex < 100002) {
              modalElement.style.zIndex = '100002';
            }
          } else {
            modalElement.style.zIndex = '100002';
          }
        });
      }
    };

    // Observar cambios en el DOM para detectar cuando el panel se abre/cierra
    const observer = new MutationObserver(() => {
      adjustTourModalZIndex();
    });

    // Observar el body para detectar cambios
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });

    // Ajustar inmediatamente
    adjustTourModalZIndex();

    // Ajustar periódicamente para asegurar que se mantenga
    const interval = setInterval(adjustTourModalZIndex, 100);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, [currentStep]);

  // Iniciar tour automáticamente si es la primera visita
  useEffect(() => {
    if (isLoading || hasStartedRef.current) return;

    if (shouldShowTour) {
      const timer = setTimeout(() => {
        hasStartedRef.current = true;
        startTour();
        startNextStep(COURSE_LEARN_TOUR_ID);
      }, 2000); // Delay para asegurar que la UI esté lista

      return () => clearTimeout(timer);
    }
  }, [isLoading, shouldShowTour, startTour, startNextStep]);

  // Handle step change for interactive actions
  // Pasos del tour (0-indexed):
  // 0: Welcome, 1: Sidebar, 2: Video tab, 3: Transcript tab, 
  // 4: Summary tab, 5: Activities tab, 6: Questions tab,
  // 7: LIA button, 8: LIA panel, 9: Wrap up
  const handleStepChange = (step: number) => {
    const previousStep = previousStepRef.current;
    
    // Si se retrocede desde el paso 8 (panel de LIA), cerrar el panel
    if (previousStep === 8 && step < 8) {
      onCloseLia?.();
    }
    
    // Actualizar referencias
    previousStepRef.current = step;
    setCurrentStep(step); // Actualizar el paso actual en el contexto
    
    switch (step) {
      case 2: // Video tab - asegurar que esté en video
        onSwitchTab?.('video');
        break;
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
      // Paso 7: LIA button - NO abrir LIA aquí, el botón debe ser visible
      // El usuario debe ver el botón antes de que se abra el panel
      case 8: // LIA panel step - ahora sí abrir LIA
        onOpenLia?.();
        break;
      case 9: // Final step - return to video
        onSwitchTab?.('video');
        break;
    }
  };

  return (
    <TourStepContext.Provider value={{ currentStep }}>
      <NextStep
        steps={courselearnTourSteps}
        showNextStep={true}
        shadowRgb="0, 0, 0"
        shadowOpacity="0.85"
        cardComponent={GlobalTourCard}
        onComplete={async () => {
          await completeTour();
          closeNextStep();
          setCurrentStep(null);
          previousStepRef.current = null;
          onCloseLia?.(); // Cerrar LIA al completar el tour
          onSwitchTab?.('video');
        }}
        onSkip={async () => {
          await skipTour();
          closeNextStep();
          setCurrentStep(null);
          previousStepRef.current = null;
          onCloseLia?.(); // Cerrar LIA al saltar el tour
          onSwitchTab?.('video');
        }}
        onStepChange={handleStepChange}
      >
        {children}
      </NextStep>
    </TourStepContext.Provider>
  );
}

export function CourseLearnTourWrapper({ 
  children,
  onOpenLia,
  onCloseLia,
  onSwitchTab
}: CourseLearnTourWrapperProps) {
  return (
    <NextStepProvider>
      <CourseLearnTourContent
        onOpenLia={onOpenLia}
        onCloseLia={onCloseLia}
        onSwitchTab={onSwitchTab}
      >
        {children}
      </CourseLearnTourContent>
    </NextStepProvider>
  );
}
