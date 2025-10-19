import React from 'react';
import * as LucideIcons from 'lucide-react';
export type IconName = keyof typeof LucideIcons;
export interface IconProps extends React.SVGAttributes<SVGElement> {
    name: IconName;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
    color?: string;
    className?: string;
    animate?: boolean;
}
declare function Icon({ name, size, color, className, animate, ...props }: IconProps): import("react/jsx-runtime").JSX.Element | null;
export { Icon };
//# sourceMappingURL=Icon.d.ts.map