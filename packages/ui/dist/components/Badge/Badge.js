import { jsx as _jsx } from "react/jsx-runtime";
import { cva } from 'class-variance-authority';
import { cn } from '../../utils/cn';
const badgeVariants = cva('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2', {
    variants: {
        variant: {
            default: 'border-transparent bg-primary text-white shadow hover:bg-primary/80',
            outline: 'text-primary border-primary/30 hover:bg-primary/10 hover:border-primary/50',
            gradient: 'border-transparent bg-gradient-to-r from-primary to-success text-white shadow-lg hover:shadow-primary/20 hover:scale-105',
            secondary: 'border-transparent bg-secondary text-white hover:bg-secondary/80',
            destructive: 'border-transparent bg-error text-white hover:bg-error/80',
        },
        size: {
            sm: 'text-xs px-2 py-0.5',
            md: 'text-sm px-2.5 py-1',
            lg: 'text-base px-3 py-1.5',
        },
    },
    defaultVariants: {
        variant: 'default',
        size: 'sm',
    },
});
function Badge({ className, variant, size, ...props }) {
    return (_jsx("div", { className: cn(badgeVariants({ variant, size }), className), ...props }));
}
export { Badge, badgeVariants };
//# sourceMappingURL=Badge.js.map