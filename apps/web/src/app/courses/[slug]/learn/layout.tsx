'use client';

import React from 'react';
import { LiaCourseProvider } from '../../../../features/courses/context/LiaCourseContext';

export default function LearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Joyride tour is now rendered in page.tsx to access callbacks
  return (
    <LiaCourseProvider>
      {children}
    </LiaCourseProvider>
  );
}
