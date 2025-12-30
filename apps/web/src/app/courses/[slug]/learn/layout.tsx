'use client';

import React from 'react';
import { LiaCourseProvider } from '../../../../features/courses/context/LiaCourseContext';
import { NextStepProvider, NextStep } from 'nextstepjs';
import { courselearnTourSteps, COURSE_LEARN_TOUR_ID } from '../../../../features/tours/config/course-learn-tour-steps';
import { useTourProgress } from '../../../../features/tours/hooks/useTourProgress';
import { GlobalTourCard } from '../../../../features/tours/components/GlobalTourCard';

export default function LearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { completeTour, skipTour } = useTourProgress(COURSE_LEARN_TOUR_ID);

  return (
    <LiaCourseProvider>
      <NextStepProvider>
        <NextStep
          steps={courselearnTourSteps}
          showNextStep={true}
          shadowRgb="0, 0, 0"
          shadowOpacity="0.75"
          cardComponent={GlobalTourCard}
          onComplete={completeTour}
          onSkip={skipTour}
        >
          {children}
        </NextStep>
      </NextStepProvider>
    </LiaCourseProvider>
  );
}
