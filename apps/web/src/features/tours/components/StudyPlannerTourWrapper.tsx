'use client';
import { NextStepProvider, NextStep } from 'nextstepjs';
import { studyPlannerTourSteps } from '@/features/tours/config/study-planner-tour-steps';
import { studyPlannerDashboardTourSteps } from '@/features/tours/config/study-planner-dashboard-tour-steps';
import { GlobalTourCard } from '@/features/tours/components/GlobalTourCard';
import { useTourProgress } from '@/features/tours/hooks/useTourProgress';
import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function StudyPlannerTourWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Hooks for both tours to get control functions
  // We use absolute paths to ensure correct import
  const plannerTour = useTourProgress('study-planner-tour');
  const dashboardTour = useTourProgress('study-planner-dashboard-tour');

  // Combine steps array
  const allSteps = [...studyPlannerTourSteps, ...studyPlannerDashboardTourSteps];

  const handleComplete = async () => {
    console.log('🏁 [StudyPlannerTourWrapper] Tour Completed. Path:', pathname);
    try {
      if (pathname.includes('/study-planner/create')) {
        console.log('✅ Completing planner tour');
        if (plannerTour && typeof plannerTour.completeTour === 'function') {
          await plannerTour.completeTour();
        } else {
          console.error('❌ plannerTour.completeTour is not a function', plannerTour);
        }
      } else if (pathname.includes('/study-planner/dashboard')) {
        console.log('✅ Completing dashboard tour');
        if (dashboardTour && typeof dashboardTour.completeTour === 'function') {
          await dashboardTour.completeTour();
        } else {
          console.error('❌ dashboardTour.completeTour is not a function', dashboardTour);
        }
      }
    } catch (error) {
      console.error('❌ Error handling tour completion:', error);
    }
  };

  const handleSkip = async () => {
    console.log('⏭️ [StudyPlannerTourWrapper] Tour Skipped. Path:', pathname);
    try {
      if (pathname.includes('/study-planner/create')) {
        await plannerTour.skipTour();
      } else if (pathname.includes('/study-planner/dashboard')) {
        await dashboardTour.skipTour();
      }
    } catch (error) {
      console.error('❌ Error handling tour skip:', error);
    }
  };

  return (
    <NextStepProvider>
      <NextStep
        steps={allSteps}
        cardComponent={GlobalTourCard}
        shadowRgb="0, 0, 0"
        shadowOpacity="0.7"
        onComplete={handleComplete}
        onSkip={handleSkip}
      >
        {children}
      </NextStep>
    </NextStepProvider>
  );
}
