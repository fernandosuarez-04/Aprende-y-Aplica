'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { NextStepProvider, NextStep } from 'nextstepjs';
import { dashboardTourSteps, DASHBOARD_TOUR_ID } from '@/features/tours/config/dashboard-tour-steps';
import { useTourProgress } from '@/features/tours/hooks/useTourProgress';
import { GlobalTourCard } from '@/features/tours/components/GlobalTourCard';
import { LiaSidePanel } from '@/core/components/LiaSidePanel';
import { LiaFloatingButton } from '@/core/components/LiaSidePanel/LiaFloatingButton';

export function BusinessUserTourWrapper({ children }: { children: React.ReactNode }) {
  const { completeTour, skipTour } = useTourProgress(DASHBOARD_TOUR_ID);
  const router = useRouter();

  const handleComplete = async () => {
    await completeTour();
    // Optional: redirect or just finish
    // router.push('/study-planner/create'); // This was in the original layout, keeping it.
  };

  const handleSkip = async () => {
    await skipTour();
  };

  return (
    <NextStepProvider>
      <NextStep 
        steps={dashboardTourSteps}
        showNextStep={false}
        shadowRgb="0, 0, 0"
        shadowOpacity="0.7"
        cardComponent={GlobalTourCard}
        onComplete={handleComplete}
        onSkip={handleSkip}
      >
        {children}
        <LiaSidePanel />
        <LiaFloatingButton />
      </NextStep>
    </NextStepProvider>
  );
}
