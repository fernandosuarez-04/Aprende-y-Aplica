import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../utils/cn';
const cardVariants = cva('rounded-xl border transition-all duration-300', {
    variants: {
        variant: {
            default: 'bg-surface border-border/20 text-white hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10',
            gradient: 'bg-gradient-to-r from-primary to-success border-primary/30 text-white shadow-lg shadow-primary/20',
            glassmorphism: 'bg-surface/80 backdrop-blur-sm border-white/10 text-white hover:bg-surface/90 hover:border-white/20 hover:shadow-xl hover:shadow-primary/10',
        },
        padding: {
            none: 'p-0',
            sm: 'p-4',
            md: 'p-6',
            lg: 'p-8',
        },
        shadow: {
            none: 'shadow-none',
            sm: 'shadow-sm',
            md: 'shadow-md shadow-black/10',
            lg: 'shadow-lg shadow-black/20',
        },
    },
    defaultVariants: {
        variant: 'default',
        padding: 'md',
        shadow: 'sm',
    },
});
const Card = React.forwardRef(({ className, variant, padding, shadow, animate = false, ...props }, ref) => {
    return (_jsx("div", { className: cn(cardVariants({ variant, padding, shadow }), animate && 'hover:scale-[1.02] hover:-translate-y-1', className), ref: ref, ...props }));
});
Card.displayName = 'Card';
// Sub-componentes para estructura semántica
const CardHeader = React.forwardRef(({ className, ...props }, ref) => (_jsx("div", { ref: ref, className: cn('flex flex-col space-y-1.5 pb-4', className), ...props })));
CardHeader.displayName = 'CardHeader';
const CardTitle = React.forwardRef(({ className, ...props }, ref) => (_jsx("h3", { ref: ref, className: cn('text-xl font-semibold leading-none tracking-tight text-white', className), ...props })));
CardTitle.displayName = 'CardTitle';
const CardDescription = React.forwardRef(({ className, ...props }, ref) => (_jsx("p", { ref: ref, className: cn('text-sm text-gray-300 leading-relaxed', className), ...props })));
CardDescription.displayName = 'CardDescription';
const CardContent = React.forwardRef(({ className, ...props }, ref) => (_jsx("div", { ref: ref, className: cn('pt-0', className), ...props })));
CardContent.displayName = 'CardContent';
const CardFooter = React.forwardRef(({ className, ...props }, ref) => (_jsx("div", { ref: ref, className: cn('flex items-center pt-4', className), ...props })));
CardFooter.displayName = 'CardFooter';
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants };
//# sourceMappingURL=Card.js.map