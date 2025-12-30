import React from 'react';
import { BusinessUserTourWrapper } from '@/features/tours/components/BusinessUserTourWrapper';

export default function BusinessUserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BusinessUserTourWrapper>
      {children}
    </BusinessUserTourWrapper>
  );
}

