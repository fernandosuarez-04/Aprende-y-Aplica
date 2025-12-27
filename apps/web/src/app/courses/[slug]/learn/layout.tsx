'use client';

import React from 'react';
import { LiaCourseProvider } from '../../../../features/courses/context/LiaCourseContext';

export default function LearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LiaCourseProvider>
      {children}
    </LiaCourseProvider>
  );
}
