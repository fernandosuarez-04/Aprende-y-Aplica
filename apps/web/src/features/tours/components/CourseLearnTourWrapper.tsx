'use client';

import React from 'react';
import { NextStepProvider, NextStep } from 'nextstepjs';
import { courselearnTourSteps } from '../config/course-learn-tour-steps';
import { useTourProgress } from '../hooks/useTourProgress';
import { GlobalTourCard } from './GlobalTourCard';
import { COURSE_LEARN_TOUR_ID } from '../config/course-learn-tour-steps';

interface CourseLearnTourWrapperProps {
  children: React.ReactNode;
  // Actions to control course learning page
  onOpenLia?: () => void;
  onSwitchTab?: (tab: 'video' | 'transcript' | 'summary' | 'activities' | 'questions') => void;
}

export function CourseLearnTourWrapper({ 
  children,
  onOpenLia,
  onSwitchTab
}: CourseLearnTourWrapperProps) {
  const { completeTour, skipTour } = useTourProgress(COURSE_LEARN_TOUR_ID);

  // Handle step change for interactive actions
  const handleStepChange = (step: number) => {
    switch (step) {
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
      case 8: // LIA button step
      case 9: // LIA panel step
        onOpenLia?.();
        break;
      case 10: // Final step - return to video
        onSwitchTab?.('video');
        break;
    }
  };

  return (
    <NextStepProvider>
      <NextStep
        steps={courselearnTourSteps}
        showNextStep={true}
        shadowRgb="0, 0, 0"
        shadowOpacity="0.75"
        cardComponent={GlobalTourCard}
        onComplete={async () => {
          await completeTour();
          onSwitchTab?.('video');
        }}
        onSkip={async () => {
          await skipTour();
          onSwitchTab?.('video');
        }}
        onStepChange={handleStepChange}
      >
        {children}
      </NextStep>
    </NextStepProvider>
  );
}
