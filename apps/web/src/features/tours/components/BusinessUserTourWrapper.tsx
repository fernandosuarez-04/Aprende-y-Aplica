'use client';

import React from 'react';
import { NextStepProvider, NextStep } from 'nextstepjs';
import { LiaSidePanel } from '@/core/components/LiaSidePanel';
import { LiaFloatingButton } from '@/core/components/LiaSidePanel/LiaFloatingButton';
import { dashboardTourSteps, DASHBOARD_TOUR_ID } from '../config/dashboard-tour-steps';
import { useTourProgress } from '../hooks/useTourProgress';
import { GlobalTourCard } from './GlobalTourCard';

export function BusinessUserTourWrapper({ children }: { children: React.ReactNode }) {
  const { completeTour, skipTour } = useTourProgress(DASHBOARD_TOUR_ID);

  return (
    <NextStepProvider>
      <NextStep
        steps={dashboardTourSteps}
        showNextStep={true}
        shadowRgb="0, 0, 0"
        shadowOpacity="0.75"
        cardComponent={GlobalTourCard}
        onComplete={async () => {
          await completeTour();
        }}
        onSkip={async () => {
          await skipTour();
        }}
      >
        {children}
        <LiaSidePanel />
        <LiaFloatingButton />
      </NextStep>
    </NextStepProvider>
  );
}
