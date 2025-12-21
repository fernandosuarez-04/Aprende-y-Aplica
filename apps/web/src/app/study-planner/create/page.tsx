'use client';

import React, { Suspense, lazy } from 'react';
import { StudyPlannerLIA } from '../../../features/study-planner/components/StudyPlannerLIA';

// Lazy load del tour para mejor performance
const StudyPlannerOnboardingAgent = lazy(() =>
  import('../../../features/study-planner/components/StudyPlannerOnboardingAgent').then(m => ({
    default: m.StudyPlannerOnboardingAgent
  }))
);

export default function CreateStudyPlanPage() {
  return (
    <div className="min-h-screen" suppressHydrationWarning>
      <StudyPlannerLIA />

      {/* Tour de bienvenida para el Planificador de Estudios */}
      <Suspense fallback={null}>
        <StudyPlannerOnboardingAgent />
      </Suspense>
    </div>
  );
}
