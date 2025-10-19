import React from 'react';
import * as LucideIcons from 'lucide-react';
import { cn } from '../../utils/cn';

export type IconName = keyof typeof LucideIcons;

export interface IconProps extends React.SVGAttributes<SVGElement> {
  name: IconName;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  color?: string;
  className?: string;
  animate?: boolean;
}

const sizeMap = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
} as const;

function Icon({ 
  name, 
  size = 'md', 
  color = 'currentColor', 
  className, 
  animate = false,
  ...props 
}: IconProps) {
  const IconComponent = LucideIcons[name] as React.ComponentType<React.SVGAttributes<SVGElement>>;
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }

  const iconSize = typeof size === 'number' ? size : sizeMap[size];

  return (
    <IconComponent
      width={iconSize}
      height={iconSize}
      strokeWidth={2.5}
      className={cn(
        'transition-all duration-200',
        animate && 'hover:scale-110 hover:rotate-3',
        className
      )}
      style={{ color }}
      {...props}
    />
  );
}

export { Icon };
