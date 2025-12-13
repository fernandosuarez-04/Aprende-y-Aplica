'use client';

import { ReactNode, CSSProperties } from 'react';

interface StyledCardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function StyledCard({ children, className = '', style = {} }: StyledCardProps) {
  const defaultStyle: CSSProperties = {
    backgroundColor: `rgba(15, 23, 42, var(--org-card-opacity, 1))`,
    ...style
  };

  return (
    <div 
      className={`bg-carbon-900 rounded-lg border border-carbon-700 ${className}`}
      style={defaultStyle}
    >
      {children}
    </div>
  );
}

