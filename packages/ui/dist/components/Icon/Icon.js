import { jsx as _jsx } from "react/jsx-runtime";
import * as LucideIcons from 'lucide-react';
import { cn } from '../../utils/cn';
const sizeMap = {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
};
function Icon({ name, size = 'md', color = 'currentColor', className, animate = false, ...props }) {
    const IconComponent = LucideIcons[name];
    if (!IconComponent) {
        console.warn(`Icon "${name}" not found`);
        return null;
    }
    const iconSize = typeof size === 'number' ? size : sizeMap[size];
    return (_jsx(IconComponent, { width: iconSize, height: iconSize, className: cn('transition-all duration-200', animate && 'hover:scale-110 hover:rotate-3', className), style: { color }, ...props }));
}
export { Icon };
//# sourceMappingURL=Icon.js.map